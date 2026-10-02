// Review collection page — LIVE, ISOLATED prototype.
// Path: /neverpull/review  (srbev.com is site-wide noindex; this route also
// carries its own noindex). Linked only from the /neverpull/spin-test button page.
//
// TEST MODE: submissions write NOTHING (no Supabase, HubSpot, or Klaviyo). The
// payload is logged to the console and the success state shows the reward code.
// Production wiring replaces submitReview():
//   POST /api/public/review → Supabase `reviews` (status = pending) →
//   Klaviyo event "Submitted Review" (sends code, stops Review Request reminders).
//
// Form order (founder spec, 2026-10-02): stars → first name* / last name →
// email* → flavors (optional multi-select; each chosen flavor gets its own
// optional short review) → headline → message* → submit → publish disclaimer.
// Reward is the same for every rating; publish consent is given by submitting
// (disclaimer beneath the button). Public display: first name + last initial.
//
// Flavors list LIVE SKUs only, gated by the same SHOW_NON_LIVE_PRODUCTS flag +
// LIVE_SLUGS set as the storefront (sunrise/src/routes/products.tsx).
// ?product=<slug>[,<slug>…] pre-selects listed flavors (e.g.
// ?product=60mg-blackberry-cbn), so Review Request emails can deep-link per
// flavor. Slugs are site slugs, not Shopify handles — production order
// verification must map them.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./contact.css";
import "./review.css";

export const Route = createFileRoute("/neverpull/review")({
  component: ReviewPage,
  head: () => ({
    meta: [
      { title: "Leave a Review · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Tell us how your SUNRISE tasted. Every review earns 15% off your next order.",
      },
    ],
  }),
});

// ── CONFIG ───────────────────────────────────────────────────────────────
const TEST_MODE = true;
const REWARD_CODE = "15OFFREVIEW";
const REWARD_TERMS = "15% off any pack of 20 cans or fewer. One use per order.";
const BODY_MIN = 20;
const BODY_MAX = 1000;
const HEADLINE_MAX = 80;
const FLAVOR_NOTE_MAX = 500;
const LAST_NAME_MAX = 40;

// ── PRODUCT DATA (canonical: sunrise/src/routes/products.tsx) ────────────
// Mirrors the storefront's live-SKU gate. Keep LIVE_SLUGS in sync with
// products.tsx; reverse by setting SHOW_NON_LIVE_PRODUCTS = true.
const SHOW_NON_LIVE_PRODUCTS = false;
const LIVE_SLUGS = new Set<string>([
  "10mg-strawberry",
  "10mg-watermelon",
  "10mg-lemonade",
  "30mg-peach-mango",
  "30mg-cherry-limeade",
  "30mg-orange-lemonade",
  "30mg-kiwi-watermelon-cbg",
  "30mg-blueberry-pomegranate-cbn",
  "30mg-strawberry-watermelon-thcv",
  "60mg-wild-cherry-peach",
  "60mg-blueberry-lemonade",
  "60mg-passionfruit-mango",
  "60mg-blood-orange-cbg",
  "60mg-blackberry-cbn",
  "60mg-strawberry-kiwi-thcv",
]);

type Cannabinoid = "CBG" | "CBN" | "THCV";
type TierKey = "5" | "10" | "30" | "60";
type Flavor = { name: string; cannabinoid?: Cannabinoid };

const TIERS: { tier: TierKey; label: string; flavors: Flavor[] }[] = [
  {
    tier: "5",
    label: "5MG · Subtle Lift",
    flavors: [
      { name: "Blackberry" },
      { name: "Blood Orange" },
      { name: "Passionfruit Mango" },
      { name: "Blueberry Lemonade", cannabinoid: "CBG" },
      { name: "Black Cherry", cannabinoid: "CBN" },
      { name: "Strawberry Peach", cannabinoid: "THCV" },
    ],
  },
  {
    tier: "10",
    label: "10MG · Perfect Buzz",
    flavors: [
      { name: "Strawberry" },
      { name: "Watermelon" },
      { name: "Lemonade" },
      { name: "Tangerine", cannabinoid: "CBG" },
      { name: "Blackberry Lemonade", cannabinoid: "CBN" },
      { name: "Blueberry Acai", cannabinoid: "THCV" },
    ],
  },
  {
    tier: "30",
    label: "30MG · Deeper Dive",
    flavors: [
      { name: "Peach Mango" },
      { name: "Cherry Limeade" },
      { name: "Orange Lemonade" },
      { name: "Kiwi Watermelon", cannabinoid: "CBG" },
      { name: "Blueberry Pomegranate", cannabinoid: "CBN" },
      { name: "Strawberry Watermelon", cannabinoid: "THCV" },
    ],
  },
  {
    tier: "60",
    label: "60MG · Elevated Experience",
    flavors: [
      { name: "Passionfruit Mango" },
      { name: "Wild Cherry Peach" },
      { name: "Blueberry Lemonade" },
      { name: "Blood Orange", cannabinoid: "CBG" },
      { name: "Blackberry", cannabinoid: "CBN" },
      { name: "Strawberry Kiwi", cannabinoid: "THCV" },
    ],
  },
];

function toSlug(tier: TierKey, f: Flavor): string {
  const base = f.name.toLowerCase().replace(/\s+/g, "-");
  const suffix = f.cannabinoid ? `-${f.cannabinoid.toLowerCase()}` : "";
  return `${tier}mg-${base}${suffix}`;
}

function optionLabel(tier: TierKey, f: Flavor): string {
  return `${f.name} (${tier}MG${f.cannabinoid ? ` + ${f.cannabinoid}` : ""})`;
}

// Tiers with only the flavors the storefront currently sells; empty tiers drop.
const VISIBLE_TIERS = TIERS.map(({ tier, label, flavors }) => ({
  tier,
  label,
  flavors: flavors.filter((f) => SHOW_NON_LIVE_PRODUCTS || LIVE_SLUGS.has(toSlug(tier, f))),
})).filter((t) => t.flavors.length > 0);

const VALID_SLUGS = new Set(
  VISIBLE_TIERS.flatMap(({ tier, flavors }) => flavors.map((f) => toSlug(tier, f))),
);

const RATING_WORDS = ["", "Not for me", "It's okay", "Good", "Great", "Love it"];

// slug → dropdown label, in display order (tier, then flavor position).
const FLAVOR_LABELS = new Map<string, string>(
  VISIBLE_TIERS.flatMap(({ tier, flavors }) =>
    flavors.map((f) => [toSlug(tier, f), optionLabel(tier, f)] as const),
  ),
);
const FLAVOR_ORDER = [...FLAVOR_LABELS.keys()];

// ── TYPES ────────────────────────────────────────────────────────────────
type Errors = Partial<Record<"rating" | "firstName" | "email" | "body", string>>;

type ReviewPayload = {
  rating: number;
  firstName: string;
  lastName: string; // optional; shown publicly as its initial only
  email: string;
  flavors: { slug: string; review: string }[]; // empty = general review
  headline: string;
  body: string;
  consentToPublish: true; // given by submitting (disclaimer beneath button)
  sourcePage: string;
  submittedAt: string;
};

// ── SUBMIT (test mode: no network) ───────────────────────────────────────
async function submitReview(payload: ReviewPayload): Promise<void> {
  if (TEST_MODE) {
    // eslint-disable-next-line no-console
    console.info("[review TEST MODE] payload (not sent):", payload);
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  const res = await fetch("/api/public/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
}

// ── FLAVOR MULTI-SELECT ──────────────────────────────────────────────────
// Dropdown trigger styled like the form's selects; opens a tier-grouped
// checkbox panel. Closes on outside click or Escape.
function FlavorMultiSelect({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const summary =
    selected.length === 0
      ? "Choose flavors"
      : selected.length === 1
        ? FLAVOR_LABELS.get(selected[0]) ?? "1 flavor selected"
        : `${selected.length} flavors selected`;

  return (
    <div className="rv-ms" ref={rootRef}>
      <button
        type="button"
        className={`c-select rv-ms-trigger${selected.length ? "" : " rv-ms-empty"}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {summary}
      </button>
      {open && (
        <div className="rv-ms-panel" role="group" aria-label="Flavors">
          {VISIBLE_TIERS.map(({ tier, label, flavors }) => (
            <div key={tier} className="rv-ms-group">
              <div className="rv-ms-group-label">{label}</div>
              {flavors.map((f) => {
                const slug = toSlug(tier, f);
                return (
                  <label key={slug} className="rv-ms-option">
                    <input
                      type="checkbox"
                      checked={selected.includes(slug)}
                      onChange={() => onToggle(slug)}
                    />
                    <span>{optionLabel(tier, f)}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── COMPONENT ────────────────────────────────────────────────────────────
function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [flavors, setFlavors] = useState<string[]>([]);
  const [flavorNotes, setFlavorNotes] = useState<Record<string, string>>({});
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // The lander's legacy Spin & Save popup is kept off this page by the
  // NO_WHEEL_PATHS check in components/SpinWheel.tsx.

  // Pre-select flavors from ?product=<slug>[,<slug>…]. Browser-only.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("product");
    if (!raw) return;
    const picks = raw.split(",").map((x) => x.trim()).filter((x) => VALID_SLUGS.has(x));
    if (picks.length) setFlavors(FLAVOR_ORDER.filter((s) => picks.includes(s)));
  }, []);

  const clear = (key: keyof Errors) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Keep selections in display order so the per-flavor boxes don't jump.
  const toggleFlavor = (slug: string) =>
    setFlavors((cur) =>
      cur.includes(slug)
        ? cur.filter((s) => s !== slug)
        : FLAVOR_ORDER.filter((s) => s === slug || cur.includes(s)),
    );

  const validate = (): Errors => {
    const next: Errors = {};
    if (rating < 1) next.rating = "Pick a star rating.";
    if (!firstName.trim()) next.firstName = "First name needed.";
    if (!email.trim()) next.email = "Email needed.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Email looks off.";
    if (body.trim().length < BODY_MIN) next.body = `A few more words, please (at least ${BODY_MIN} characters).`;
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitReview({
        rating,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        flavors: flavors.map((slug) => ({ slug, review: (flavorNotes[slug] ?? "").trim() })),
        headline: headline.trim(),
        body: body.trim(),
        consentToPublish: true,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : "/neverpull/review",
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      // Bring the success card (and the code) into view — on phones the card
      // sits below the side copy, so scrolling to page top would hide the code.
      requestAnimationFrame(() =>
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please email hello@savorsunrise.com.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(REWARD_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  // Name and email carry over; everything about the review itself resets.
  const resetForAnother = () => {
    setSubmitted(false);
    setRating(0);
    setFlavors([]);
    setFlavorNotes({});
    setHeadline("");
    setBody("");
    setErrors({});
    setCopied(false);
  };

  const shownRating = hoverRating || rating;

  return (
    <>
      <SiteHeader />

      <main className="rv-page">
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="c-pagehero rv-pagehero">
          <p className="c-pagehero-title" aria-label="Reviews">
            {"Reviews".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch}</span>
            ))}
          </p>
        </section>

        {/* ── 02 · FORM ─────────────────────────────────────────────────── */}
        <section className="c-form-section">
          <div className="container">
            <div className="c-form-grid">
              <div className="c-form-side">
                <div className="c-eyebrow">Share Your Sunrise</div>
                <h1 className="c-form-headline">
                  How was your <span className="accent rv-accent">sip?</span>
                </h1>
                <p className="c-form-sub">
                  Tell us about the taste, the feel, and the moments you reach for it.
                  Leave us an honest review and automatically earn{" "}
                  <strong>15% off</strong> your next order.
                </p>
              </div>

              <div className="c-form-card rv-card" ref={cardRef}>
                {submitted ? (
                  <div className="c-success" role="status" aria-live="polite">
                    <div className="c-success-eyebrow">Review Received</div>
                    <div className="c-success-headline">Thanks for the feedback</div>
                    <p className="c-success-body">
                      Here's 15% off your next order, our thanks for sharing.
                    </p>

                    {/* Mirrors the Spin & Save code box (dashed gold, copy icon). */}
                    <button type="button" className="rv-code" onClick={copyCode} title="Copy code">
                      <span className="rv-code-text">{REWARD_CODE}</span>
                      <span className="rv-code-copy">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="rv-copy-icon">
                          <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                          <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {copied ? "Copied!" : "Copy"}
                      </span>
                    </button>
                    <div className="rv-fine">{REWARD_TERMS}</div>

                    <div className="c-success-ctas">
                      <a href="/neverpull/products" className="btn btn-primary">
                        Shop the Lineup
                      </a>
                      <button type="button" className="btn btn-secondary" onClick={resetForAnother}>
                        Add Another Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="c-form" onSubmit={handleSubmit} noValidate>
                    {/* Rating */}
                    <fieldset className="rv-rating-field">
                      <legend className="c-field-label">Your Rating</legend>
                      <div
                        className="rv-stars"
                        role="radiogroup"
                        aria-label="Star rating"
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label
                            key={n}
                            className={`rv-star${n <= shownRating ? " rv-star-on" : ""}`}
                            onMouseEnter={() => setHoverRating(n)}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={n}
                              checked={rating === n}
                              onChange={() => {
                                setRating(n);
                                clear("rating");
                              }}
                              className="rv-star-input"
                              aria-label={`${n} star${n > 1 ? "s" : ""} — ${RATING_WORDS[n]}`}
                            />
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="rv-star-icon">
                              <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z" />
                            </svg>
                          </label>
                        ))}
                        <span className="rv-rating-word" aria-live="polite">
                          {shownRating ? RATING_WORDS[shownRating] : "Tap to rate"}
                        </span>
                      </div>
                      {errors.rating && <span className="c-field-error">{errors.rating}</span>}
                    </fieldset>

                    {/* Name */}
                    <div className="c-form-row c-form-row-split">
                      <label className="c-field">
                        <span className="c-field-label">First Name</span>
                        <input
                          type="text"
                          className={`c-input${errors.firstName ? " c-input-error" : ""}`}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            clear("firstName");
                          }}
                          autoComplete="given-name"
                          aria-invalid={errors.firstName ? true : undefined}
                        />
                        {errors.firstName && <span className="c-field-error">{errors.firstName}</span>}
                      </label>
                      <label className="c-field">
                        <span className="c-field-label">
                          Last Name <span className="rv-optional">(optional)</span>
                        </span>
                        <input
                          type="text"
                          className="c-input"
                          value={lastName}
                          maxLength={LAST_NAME_MAX}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                        />
                      </label>
                    </div>

                    {/* Email */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Email</span>
                        <input
                          type="email"
                          className={`c-input${errors.email ? " c-input-error" : ""}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clear("email");
                          }}
                          autoComplete="email"
                          aria-invalid={errors.email ? true : undefined}
                        />
                        {errors.email && <span className="c-field-error">{errors.email}</span>}
                      </label>
                    </div>

                    {/* Flavors (optional multi-select) + one short review per flavor */}
                    <div className="c-form-row">
                      <div className="c-field">
                        <span className="c-field-label">
                          Flavor <span className="rv-optional">(optional)</span>
                        </span>
                        <FlavorMultiSelect selected={flavors} onToggle={toggleFlavor} />
                      </div>
                    </div>
                    {flavors.map((slug) => (
                      <div key={slug} className="c-form-row rv-flavor-note">
                        <label className="c-field">
                          <span className="c-field-label">
                            {FLAVOR_LABELS.get(slug)} <span className="rv-optional">(optional)</span>
                          </span>
                          <textarea
                            className="c-textarea rv-flavor-textarea"
                            value={flavorNotes[slug] ?? ""}
                            maxLength={FLAVOR_NOTE_MAX}
                            rows={2}
                            placeholder="A quick take on this flavor"
                            onChange={(e) =>
                              setFlavorNotes((n) => ({ ...n, [slug]: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    ))}

                    {/* Headline */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">
                          Headline <span className="rv-optional">(optional)</span>
                        </span>
                        <input
                          type="text"
                          className="c-input"
                          value={headline}
                          maxLength={HEADLINE_MAX}
                          placeholder="Sum it up in a few words"
                          onChange={(e) => setHeadline(e.target.value)}
                        />
                      </label>
                    </div>

                    {/* Message */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Message</span>
                        <textarea
                          className={`c-textarea${errors.body ? " c-input-error" : ""}`}
                          value={body}
                          maxLength={BODY_MAX}
                          placeholder="How did it taste? How did it feel? When do you enjoy it?"
                          onChange={(e) => {
                            setBody(e.target.value);
                            clear("body");
                          }}
                          aria-invalid={errors.body ? true : undefined}
                        />
                        {errors.body && <span className="c-field-error">{errors.body}</span>}
                      </label>
                    </div>

                    <div className="c-form-submit">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Sending…" : "Submit Review"}
                      </button>
                      {submitError && (
                        <span className="c-field-error" role="alert" style={{ display: "block", marginTop: "0.5rem" }}>
                          {submitError}
                        </span>
                      )}
                    </div>

                    <div className="c-form-note rv-disclosure">
                      By submitting, you agree that SUNRISE may publish your review, rating,
                      and first name with last initial on its website and in its marketing.
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
