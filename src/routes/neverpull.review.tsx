// Review collection page — LIVE, ISOLATED prototype.
// Path: /neverpull/review  (srbev.com is site-wide noindex; this route also
// carries its own noindex). Linked only from the /neverpull/spin-test button page.
//
// TEST MODE: submissions write NOTHING (no Supabase, HubSpot, or Klaviyo). The
// payload is logged to the console and the success state shows the reward code.
// Production wiring (see SUNRISE_Review_Page brief) replaces submitReview():
//   POST /api/public/review → Supabase `reviews` (status = pending) →
//   Klaviyo event "Submitted Review" (sends code, stops Review Request reminders).
//
// Compliance rules baked into this page (FTC 16 CFR 465 + brand wellness rule):
//   • Reward is identical for every rating — never conditioned on sentiment.
//   • Incentive disclosed on the page.
//   • Moderation is neutral (privacy, profanity, medical claims) — never rating.
//   • Publish consent + 21+ confirmation are required.
//   • Reviewers are asked not to include medical or health claims.
//
// Flavor is OPTIONAL (empty = general brand review). The dropdown lists LIVE
// SKUs only, gated by the same SHOW_NON_LIVE_PRODUCTS flag + LIVE_SLUGS set as
// the storefront (sunrise/src/routes/products.tsx) — flip the flag to show all.
// ?product=<slug> pre-selects a listed flavor (e.g. ?product=60mg-blackberry-cbn),
// so Review Request emails can deep-link per flavor. Slugs are site slugs, not
// Shopify handles — production order verification must map them.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
const REWARD_TERMS = "15% off any pack of 20 cans or fewer. One use per customer.";
const BODY_MIN = 20;
const BODY_MAX = 1000;
const HEADLINE_MAX = 80;

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

const MULTIPLE = "multiple";

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

// ── TYPES ────────────────────────────────────────────────────────────────
type Errors = Partial<
  Record<
    "rating" | "headline" | "body" | "firstName" | "lastInitial" | "email" | "age21" | "consent",
    string
  >
>;

type ReviewPayload = {
  rating: number;
  productSlug: string; // "" = no flavor chosen (general review)
  headline: string;
  body: string;
  firstName: string;
  lastInitial: string;
  email: string;
  confirmedAge21: true;
  consentToPublish: true;
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

// ── COMPONENT ────────────────────────────────────────────────────────────
function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [productSlug, setProductSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [email, setEmail] = useState("");
  const [age21, setAge21] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep the lander's legacy Spin & Save popup off this page (per session).
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* private browsing — harmless */
    }
  }, []);

  // Pre-select product from ?product=<slug>. Browser-only.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("product");
    if (p && (VALID_SLUGS.has(p) || p === MULTIPLE)) setProductSlug(p);
  }, []);

  const clear = (key: keyof Errors) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (rating < 1) next.rating = "Pick a star rating.";
    if (headline.trim().length > HEADLINE_MAX) next.headline = `Keep it under ${HEADLINE_MAX} characters.`;
    const len = body.trim().length;
    if (len < BODY_MIN) next.body = `A few more words, please (at least ${BODY_MIN} characters).`;
    else if (len > BODY_MAX) next.body = `Keep it under ${BODY_MAX} characters.`;
    if (!firstName.trim()) next.firstName = "First name needed.";
    if (!/^\p{L}$/u.test(lastInitial.trim())) next.lastInitial = "One letter.";
    if (!email.trim()) next.email = "Email needed.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Email looks off.";
    if (!age21) next.age21 = "You must be 21 or older to leave a review.";
    if (!consent) next.consent = "We need your permission to publish your review.";
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
        productSlug,
        headline: headline.trim(),
        body: body.trim(),
        firstName: firstName.trim(),
        lastInitial: lastInitial.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        confirmedAge21: true,
        consentToPublish: true,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : "/neverpull/review",
        submittedAt: new Date().toISOString(),
      });
      setSubmitted(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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
      /* clipboard blocked — code is visible to copy manually */
    }
  };

  const resetForAnother = () => {
    setSubmitted(false);
    setRating(0);
    setProductSlug("");
    setHeadline("");
    setBody("");
    setErrors({});
  };

  const shownRating = hoverRating || rating;
  const bodyLen = body.trim().length;

  return (
    <>
      <SiteHeader />

      <main>
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
                  Every honest review earns 15% off your next order, whatever rating
                  you give.
                </p>
                <div className="rv-reward-badge" aria-hidden="true">
                  <span className="rv-reward-pct">15%</span>
                  <span className="rv-reward-label">off your next order</span>
                </div>
              </div>

              <div className="c-form-card">
                {submitted ? (
                  <div className="c-success" role="status" aria-live="polite">
                    <div className="c-success-eyebrow">Review Received</div>
                    <div className="c-success-headline">Thanks for the feedback</div>
                    <p className="c-success-body">
                      Here's 15% off your next order, our thanks for sharing. Reviews go
                      live after a quick check.
                    </p>

                    <div className="rv-code-block">
                      <span className="rv-code-label">Your code</span>
                      <button type="button" className="rv-code" onClick={copyCode} title="Copy code">
                        {REWARD_CODE}
                        <span className="rv-code-copy">{copied ? "Copied" : "Copy"}</span>
                      </button>
                      <span className="rv-code-terms">{REWARD_TERMS}</span>
                    </div>

                    <div className="c-success-ctas">
                      <a href="/neverpull/products" className="btn btn-primary">
                        Shop the Lineup
                      </a>
                      <button type="button" className="btn btn-secondary" onClick={resetForAnother}>
                        Review Another Flavor
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

                    {/* Product */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">
                          Flavor <span className="rv-optional">(optional)</span>
                        </span>
                        <select
                          className="c-select"
                          value={productSlug}
                          onChange={(e) => setProductSlug(e.target.value)}
                        >
                          <option value="">Choose a flavor</option>
                          {VISIBLE_TIERS.map(({ tier, label, flavors }) => (
                            <optgroup key={tier} label={label}>
                              {flavors.map((f) => {
                                const slug = toSlug(tier, f);
                                return (
                                  <option key={slug} value={slug}>
                                    {optionLabel(tier, f)}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                          <option value={MULTIPLE}>More than one flavor</option>
                        </select>
                      </label>
                    </div>

                    {/* Headline */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">
                          Headline <span className="rv-optional">(optional)</span>
                        </span>
                        <input
                          type="text"
                          className={`c-input${errors.headline ? " c-input-error" : ""}`}
                          value={headline}
                          maxLength={HEADLINE_MAX}
                          placeholder="Sum it up in a few words"
                          onChange={(e) => {
                            setHeadline(e.target.value);
                            clear("headline");
                          }}
                          aria-invalid={errors.headline ? true : undefined}
                        />
                        {errors.headline && <span className="c-field-error">{errors.headline}</span>}
                      </label>
                    </div>

                    {/* Body */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Your Review</span>
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
                          aria-describedby="rv-body-hint"
                        />
                        <span className="rv-field-meta">
                          <span id="rv-body-hint" className="rv-hint">
                            Please skip medical or health claims. We can't publish those.
                          </span>
                          <span className={`rv-count${bodyLen > BODY_MAX ? " rv-count-over" : ""}`}>
                            {bodyLen}/{BODY_MAX}
                          </span>
                        </span>
                        {errors.body && <span className="c-field-error">{errors.body}</span>}
                      </label>
                    </div>

                    {/* Name */}
                    <div className="c-form-row rv-name-row">
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
                        <span className="c-field-label">Last Initial</span>
                        <input
                          type="text"
                          className={`c-input${errors.lastInitial ? " c-input-error" : ""}`}
                          value={lastInitial}
                          maxLength={1}
                          onChange={(e) => {
                            setLastInitial(e.target.value);
                            clear("lastInitial");
                          }}
                          aria-invalid={errors.lastInitial ? true : undefined}
                        />
                        {errors.lastInitial && <span className="c-field-error">{errors.lastInitial}</span>}
                      </label>
                    </div>
                    <span className="rv-hint rv-hint-tight">
                      Shown publicly as first name and last initial, e.g. "Jordan M."
                    </span>

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
                        <span className="rv-hint">
                          Used to verify your order and send your code. Never shown publicly.
                        </span>
                        {errors.email && <span className="c-field-error">{errors.email}</span>}
                      </label>
                    </div>

                    {/* Checkboxes */}
                    <div className="rv-checks">
                      <label className={`rv-check${errors.age21 ? " rv-check-error" : ""}`}>
                        <input
                          type="checkbox"
                          checked={age21}
                          onChange={(e) => {
                            setAge21(e.target.checked);
                            clear("age21");
                          }}
                        />
                        <span>I'm 21 or older.</span>
                      </label>
                      {errors.age21 && <span className="c-field-error">{errors.age21}</span>}

                      <label className={`rv-check${errors.consent ? " rv-check-error" : ""}`}>
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => {
                            setConsent(e.target.checked);
                            clear("consent");
                          }}
                        />
                        <span>
                          SUNRISE may publish my review, rating, and first name with last
                          initial on its website and in its marketing.
                        </span>
                      </label>
                      {errors.consent && <span className="c-field-error">{errors.consent}</span>}
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
                      Every reviewer gets the same 15% off code, whatever rating they give.
                      Reviews are published after a quick check for privacy, profanity, and
                      medical claims, never based on rating.
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
