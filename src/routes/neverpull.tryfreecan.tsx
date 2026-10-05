// FREE CAN landing page — LIVE, ISOLATED prototype of the Meta free-can page.
// Path: /neverpull/tryfreecan  (srbev.com is site-wide noindex; this route also
// carries its own noindex). Linked only from the /neverpull/spin-test button page.
// Brief: SUNRISE_WebDesign_Lander_TryFreeCan_Prototype_v2_2026-10-05.
//
// Flow: pick one can → email → reveal (fireworks + TRYFREECAN code) →
// "Continue to Checkout" creates a REAL Storefront cart with TRYFREECAN applied
// and sends the visitor to Shopify checkout ($0.00 can, $9.99 shipping).
//
// TEST MODE: the email claim writes NOTHING (no Klaviyo, HubSpot, Supabase).
// The payload is logged as "[tryfreecan TEST MODE]". Cart + checkout are LIVE.
//
// ⚠️ STANDING RULE — LANDER ELEMENTS ARE FOR THIS PROTOTYPE ONLY.
// Approve this page for layout, flow and behavior. When it is rebuilt on
// savorsunrise.com (/tryfreecan), every lander element below is replaced with
// the MAIN SITE's own version:
//
//   Element              | Prototype (lander)                  | Main-site build MUST use
//   ---------------------|-------------------------------------|---------------------------------------------
//   Potency lockups      | lander sunrise-components: "ACTIVE" | main sunrise-components: "10 MG THC"
//   Cannabinoid strip    | lander: "+BLEND"                    | main: "+CBG" / "+CBN" / "+THCV"
//   Can images           | lander lib/heroCans HERO_CANS       | main public/images/cans/<slug>.webp as
//                        | (blurred cutouts, data URIs)        | CARD-SIZED derivatives (full renders ~210–280 KB)
//   Footer               | lander SiteFooter (no disclaimer)   | main footer legal block INCLUDING full disclaimer
//   Header               | logo-only, lander paint             | main wordmark, logo-only (no nav, no cart)
//   Announcement bar     | lander's, left as-is                | main's, left as-is
//   Writes               | TEST_MODE: console only             | real "Claimed Free Can" event + Klaviyo subscribe
//                        |                                     | + HubSpot (web_signup_source = Free Can)
//   Popup suppression    | lander NO_WHEEL_PATHS               | main path check inside SpinWheel.eligible()
//   Checkout email       | off                                 | on (cartCreate buyerIdentity.email)
//   `source` in payload  | hard-coded "meta"                   | derived from session UTMs
//
// Peach Mango uses the corrected brand color #E59177 (main still renders #E89B5B —
// fixing main is separate work). Other names/descriptors/colors mirror main's
// products_.$slug.tsx. Card geometry mirrors main's FreeSampleSection (.fs-*).

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { storefrontApiRequest } from "../lib/shopify";
import { HERO_CANS } from "../lib/heroCans";
import {
  renderWordmark,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  getBasePx,
} from "../lib/sunrise-components";
import "./tryfreecan.css";

export const Route = createFileRoute("/neverpull/tryfreecan")({
  component: TryFreeCanPage,
  head: () => ({
    meta: [
      { title: "Free Can · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// ── CONFIG ───────────────────────────────────────────────────────────────
const TEST_MODE = true;
const CODE = "TRYFREECAN";
const SHIPPING = "$9.99";
const STORAGE_KEY = "sunrise:tryfreecan";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type Tier = 10 | 30 | 60;
type Cannabinoid = "CBG" | "CBN" | "THCV";
type Can = {
  slug: string;
  flavor: string;
  descriptor: string;
  color: string;
  tier: Tier;
  cannabinoid?: Cannabinoid;
  variantId: string;
  // Explicit name lines for 3-word flavors; the name block reserves 2 lines.
  nameLines?: string[];
};

const V = (id: string) => `gid://shopify/ProductVariant/${id}`;

// The 15 live SINGLE CAN variants (verified in Shopify Oct 5 2026).
const CANS: Can[] = [
  { slug: "10mg-strawberry", flavor: "Strawberry", descriptor: "Fresh + Fruity", color: "#CC1F39", tier: 10, variantId: V("67621433311444") },
  { slug: "10mg-watermelon", flavor: "Watermelon", descriptor: "Sweet + Juicy", color: "#0A6034", tier: 10, variantId: V("67621432197332") },
  { slug: "10mg-lemonade", flavor: "Lemonade", descriptor: "Crisp + Tangy", color: "#E0AD2C", tier: 10, variantId: V("67621433966804") },
  { slug: "30mg-peach-mango", flavor: "Peach Mango", descriptor: "Lush + Tropical", color: "#E59177", tier: 30, variantId: V("67621420695764") },
  { slug: "30mg-cherry-limeade", flavor: "Cherry Limeade", descriptor: "Tart + Refreshing", color: "#67092A", tier: 30, variantId: V("67621423677652") },
  { slug: "30mg-orange-lemonade", flavor: "Orange Lemonade", descriptor: "Bright + Tart", color: "#FAA819", tier: 30, variantId: V("67621422432468") },
  { slug: "30mg-kiwi-watermelon-cbg", flavor: "Kiwi Watermelon", descriptor: "Crisp + Cool", color: "#A4BC47", tier: 30, cannabinoid: "CBG", variantId: V("67621420105940") },
  { slug: "30mg-blueberry-pomegranate-cbn", flavor: "Blueberry Pomegranate", descriptor: "Tart + Vibrant", color: "#21285A", tier: 30, cannabinoid: "CBN", variantId: V("67621419581652") },
  { slug: "30mg-strawberry-watermelon-thcv", flavor: "Strawberry Watermelon", descriptor: "Sweet + Fresh", color: "#0A6034", tier: 30, cannabinoid: "THCV", variantId: V("67621414895828") },
  { slug: "60mg-wild-cherry-peach", flavor: "Wild Cherry Peach", descriptor: "Lush + Juicy", color: "#861625", tier: 60, variantId: V("67621510709460"), nameLines: ["Wild Cherry", "Peach"] },
  { slug: "60mg-blueberry-lemonade", flavor: "Blueberry Lemonade", descriptor: "Rich + Tangy", color: "#21285A", tier: 60, variantId: V("67621510742228") },
  { slug: "60mg-passionfruit-mango", flavor: "Passionfruit Mango", descriptor: "Bright + Breezy", color: "#60203A", tier: 60, variantId: V("67621447565524") },
  { slug: "60mg-blood-orange-cbg", flavor: "Blood Orange", descriptor: "Tart + Punchy", color: "#DC7F27", tier: 60, cannabinoid: "CBG", variantId: V("67621455823060") },
  { slug: "60mg-blackberry-cbn", flavor: "Blackberry", descriptor: "Dark + Smooth", color: "#2E1E3D", tier: 60, cannabinoid: "CBN", variantId: V("67621455266004") },
  { slug: "60mg-strawberry-kiwi-thcv", flavor: "Strawberry Kiwi", descriptor: "Sweet + Tangy", color: "#CC1F39", tier: 60, cannabinoid: "THCV", variantId: V("67621446975700") },
];
const TIERS: { tier: Tier; color: string }[] = [
  { tier: 10, color: "#CC1F39" },
  { tier: 30, color: "#0A6034" },
  { tier: 60, color: "#2E1E3D" },
];
const bySlug = (slug: string | null) => CANS.find((c) => c.slug === slug) ?? null;

// fysInk luminance rule: on light flavor colors (relative luminance > 0.3 —
// Lemonade, Orange Lemonade, Peach Mango, Kiwi Watermelon, Blood Orange),
// flavor-colored ink on cream is illegible, so flip it to near-black.
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const inkFor = (hex: string) => (luminance(hex) > 0.3 ? "#1A1A1A" : hex);

const tierLockup = (tier: Tier, base: number, color: string) =>
  tier === 10 ? render10mgLockup(base, color) : tier === 30 ? render30mgLockup(base, color) : render60mgLockup(base, color);
const cbLockup = (cb: Cannabinoid, base: number, color: string) =>
  cb === "CBG" ? renderCBGLockup(base, color) : cb === "CBN" ? renderCBNLockup(base, color) : renderTHCVLockup(base, color);

function readSaved(): { slug: string; claimed: boolean } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { slug?: unknown; claimed?: unknown };
    if (typeof v.slug === "string" && v.claimed === true && bySlug(v.slug)) return { slug: v.slug, claimed: true };
  } catch {
    /* private browsing / bad JSON — start fresh */
  }
  return null;
}

// Fireworks — main's Spin & Save burst (SpinWheel.tsx Fireworks()), namespaced.
function Fireworks() {
  const bursts = [
    { top: "34%", left: "22%", color: "var(--tier-5)", delay: "0s" },
    { top: "28%", left: "72%", color: "var(--tier-10)", delay: "0.12s" },
    { top: "60%", left: "54%", color: "var(--tier-30)", delay: "0.26s" },
    { top: "44%", left: "44%", color: "var(--tier-60)", delay: "0.08s" },
  ];
  return (
    <div className="tfc-fireworks" aria-hidden="true">
      {bursts.map((b, i) => (
        <span key={i} className="tfc-burst" style={{ top: b.top, left: b.left, color: b.color, animationDelay: b.delay }}>
          {Array.from({ length: 12 }).map((_, j) => (
            <span key={j} className="tfc-particle" style={{ "--rotate": `${j * 30}deg` } as CSSProperties} />
          ))}
        </span>
      ))}
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TryFreeCanPage() {
  const wmRef = useRef<HTMLDivElement>(null);
  const lockupRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const cbRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const tierHeadRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const claimRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const revealRef = useRef<HTMLElement>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pickPrompt, setPickPrompt] = useState(false);
  const [claimInView, setClaimInView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const current = bySlug(selected);

  // Suppress the legacy global wheel for this visit too (belt + braces with
  // NO_WHEEL_PATHS in SpinWheel.tsx). Restore a claimed visit (back from checkout).
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* harmless */
    }
    const saved = readSaved();
    if (saved) {
      setSelected(saved.slug);
      setClaimed(true); // no fireworks on restore — they play once, on the claim
    }
  }, []);

  // Paint the wordmark, card lockups, cannabinoid strips and tier headings.
  // Re-paints on resize / fonts-ready, and when the visible set changes.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const mobile = window.innerWidth <= 768;
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(mobile ? base * 0.69 * 1.26 : base * 0.69, "gradient");
      const lockupBase = window.innerWidth <= 520 ? 28 : 44;
      CANS.forEach((c) => {
        const l = lockupRefs.current[c.slug];
        if (l) l.innerHTML = tierLockup(c.tier, lockupBase, "#FEFBE0");
        const cb = cbRefs.current[c.slug];
        if (cb && c.cannabinoid) cb.innerHTML = cbLockup(c.cannabinoid, base * 0.91, "#FEFBE0");
      });
      TIERS.forEach((t) => {
        const el = tierHeadRefs.current[t.tier];
        if (el) el.innerHTML = tierLockup(t.tier, mobile ? 30 : 40, t.color);
      });
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [claimed, selected]);

  // Hide the mobile sticky bar while the claim section is on screen.
  useEffect(() => {
    const el = claimRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setClaimInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [claimed]);

  const select = (slug: string, focus = false) => {
    setSelected(slug);
    setPickPrompt(false);
    if (focus) cardRefs.current[slug]?.focus();
  };

  // Radio-group keyboard: arrows move + select (wrapping), Space/Enter select.
  const onCardKey = (e: KeyboardEvent<HTMLDivElement>, slug: string) => {
    const i = CANS.findIndex((c) => c.slug === slug);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % CANS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + CANS.length) % CANS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = CANS.length - 1;
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      select(slug);
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      select(CANS[next].slug, true);
    }
  };

  const scrollToClaim = () => {
    claimRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 450);
  };

  const onClaim = () => {
    if (!current) {
      setPickPrompt(true);
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 320) {
      setEmailError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setEmailError("");

    const params = new URLSearchParams(window.location.search);
    const utms: Record<string, string> = {};
    UTM_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) utms[k] = v;
    });
    const payload = {
      email: value,
      code: CODE,
      source: "meta",
      flavor_slug: current.slug,
      variant_id: current.variantId,
      page: `${window.location.host.replace(/^www\./, "")}${window.location.pathname}`,
      ...utms,
    };
    if (TEST_MODE) {
      console.log("[tryfreecan TEST MODE]", payload);
    }
    // Production: POST the claim route (Klaviyo "Claimed Free Can" + subscribe,
    // HubSpot web_signup_source = Free Can). Never blocks the reveal.

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ slug: current.slug, claimed: true }));
    } catch {
      /* harmless */
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setCelebrate(!reduce);
    setClaimed(true);
    window.setTimeout(() => revealRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 30);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  const goToCheckout = async () => {
    if (!current || checkoutBusy) return;
    setCheckoutBusy(true);
    setCheckoutError("");
    type CartCreateData = {
      cartCreate: {
        cart: { id: string; checkoutUrl: string; discountCodes: { code: string; applicable: boolean }[] } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    };
    try {
      const res = await storefrontApiRequest<CartCreateData>(
        `mutation cartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart { id checkoutUrl discountCodes { code applicable } }
            userErrors { field message }
          }
        }`,
        { input: { lines: [{ merchandiseId: current.variantId, quantity: 1 }], discountCodes: [CODE] } },
      );
      const payload = res?.data?.cartCreate;
      const cart = payload?.cart;
      if (!cart?.checkoutUrl) throw new Error(payload?.userErrors?.map((u) => u.message).join(", ") || "cartCreate returned no cart");
      const code = cart.discountCodes.find((d) => d.code.toUpperCase() === CODE);
      if (!code?.applicable || (payload?.userErrors?.length ?? 0) > 0) {
        // Still send them on — the visible code box is the fallback.
        console.warn("[tryfreecan] discount not applicable or userErrors", { discountCodes: cart.discountCodes, userErrors: payload?.userErrors });
      }
      let url = cart.checkoutUrl;
      try {
        const u = new URL(url);
        u.searchParams.set("channel", "online_store"); // same as main formatCheckoutUrl()
        url = u.toString();
      } catch {
        /* keep the raw URL */
      }
      window.location.assign(url);
    } catch (err) {
      console.error("[tryfreecan] checkout failed", err);
      setCheckoutError("Something went wrong. Please try again.");
      setCheckoutBusy(false);
    }
  };

  const showBar = !claimed && !!current && !claimInView;

  const renderCard = (c: Can, interactive: boolean) => {
    const isSel = selected === c.slug;
    const ink = inkFor(c.color);
    const tabStop = selected ? isSel : c.slug === CANS[0].slug;
    const style = { "--card-flavor-color": c.color, "--card-ink": ink } as CSSProperties;
    const body = (
      <>
        <div className="tfc-card-can" style={{ background: c.color }}>
          <img src={HERO_CANS[c.slug]} alt={`SUNRISE ${c.flavor} seltzer can`} width={331} height={900} loading="lazy" decoding="async" />
          <span className="tfc-card-tier" aria-hidden="true" ref={(el) => { lockupRefs.current[c.slug] = el; }} />
          {c.cannabinoid && (
            <span className="tfc-card-cannabinoid" aria-hidden="true" ref={(el) => { cbRefs.current[c.slug] = el; }} />
          )}
          {interactive && (
            <span className="tfc-card-check" aria-hidden="true">
              <CheckIcon color={ink} />
            </span>
          )}
        </div>
        <div className="tfc-card-meta">
          <div className="tfc-card-name">
            {(c.nameLines ?? c.flavor.split(" ")).map((w, i, arr) => (
              <span key={i}>
                {w}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </div>
          <div className="tfc-card-descriptor">{c.descriptor}</div>
        </div>
      </>
    );
    if (!interactive) {
      return (
        <div className="tfc-card tfc-card--static" style={style}>
          {body}
        </div>
      );
    }
    return (
      <div
        key={c.slug}
        ref={(el) => { cardRefs.current[c.slug] = el; }}
        className={`tfc-card${isSel ? " is-selected" : ""}`}
        style={style}
        role="radio"
        aria-checked={isSel}
        aria-label={`${c.flavor}, ${c.descriptor}`}
        tabIndex={tabStop ? 0 : -1}
        onClick={() => select(c.slug)}
        onKeyDown={(e) => onCardKey(e, c.slug)}
      >
        {body}
      </div>
    );
  };

  return (
    <div className="tfc-page">
      {/* Logo-only header: no nav, no cart, no CTAs, no link off the page. */}
      <header className="site-header tfc-header">
        <div className="wordmark-slot" ref={wmRef} role="img" aria-label="SUNRISE" />
      </header>

      <main>
        <section className="tfc-hero">
          <div className="container">
            <h1 className="tfc-headline">
              Want a Taste?<br />
              <span className="accent">Just Cover Shipping</span>
            </h1>
            <p className="tfc-subhead">
              Pick any flavor or strength and the can is on us. Shipping is {SHIPPING}. One free can per order.
            </p>
          </div>
        </section>

        {!claimed ? (
          <>
            <section className="tfc-pick" aria-label="Choose your free can">
              <div className="container">
                <div
                  ref={gridRef}
                  className={`tfc-groups${selected ? " has-selection" : ""}`}
                  role="radiogroup"
                  aria-label="Choose your free can"
                >
                  {TIERS.map((t) => (
                    <div key={t.tier} className="tfc-group" role="group" aria-label={`${t.tier} MG`}>
                      <div className="tfc-group-head">
                        <span className="tfc-group-lockup" aria-hidden="true" ref={(el) => { tierHeadRefs.current[t.tier] = el; }} />
                      </div>
                      <div className="tfc-grid">
                        {CANS.filter((c) => c.tier === t.tier).map((c) => renderCard(c, true))}
                      </div>
                    </div>
                  ))}
                </div>
                {pickPrompt && (
                  <p className="tfc-prompt" role="alert">Pick a flavor first.</p>
                )}
              </div>
            </section>

            <section className="tfc-claim" ref={claimRef} aria-labelledby="tfc-claim-title">
              <div className="container">
                <h2 id="tfc-claim-title" className="tfc-claim-title">
                  {current ? (
                    <>Your pick: <span style={{ color: inkFor(current.color) }}>{current.flavor}</span></>
                  ) : (
                    "Pick a flavor above"
                  )}
                </h2>
                <form
                  className="tfc-form"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    onClaim();
                  }}
                >
                  <label htmlFor="tfc-email" className="tfc-label">Email address</label>
                  <input
                    ref={emailRef}
                    id="tfc-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="tfc-input"
                    placeholder="you@email.com"
                    value={email}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "tfc-email-error" : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                  />
                  {emailError && <p id="tfc-email-error" className="tfc-error">{emailError}</p>}
                  <button
                    type="submit"
                    className={`btn btn-primary tfc-claim-btn${current ? "" : " is-inactive"}`}
                    aria-disabled={!current}
                  >
                    Claim My Free Can
                  </button>
                  <p className="tfc-fine">
                    By entering your email, you agree to receive marketing emails from SUNRISE. Unsubscribe anytime.
                  </p>
                </form>
              </div>
            </section>
          </>
        ) : (
          current && (
            <section className="tfc-reveal" ref={revealRef} aria-labelledby="tfc-reveal-title">
              <div className="container">
                <div className="tfc-reveal-burst">
                  {celebrate && <Fireworks />}
                  <h2 id="tfc-reveal-title" className="tfc-reveal-title">Your Free Can Is Saved</h2>
                </div>
                <div className="tfc-reveal-card">{renderCard(current, false)}</div>
                <button type="button" className="tfc-code" onClick={copyCode} title="Copy code">
                  <span className="tfc-code-text">{CODE}</span>
                  <span className="tfc-code-copy">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="tfc-copy-icon">
                      <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
                <p className="tfc-fine tfc-code-note">
                  The code is applied for you at checkout. If it isn&rsquo;t, paste it in the discount field.
                </p>
                <button
                  type="button"
                  className="btn btn-primary tfc-checkout-btn"
                  onClick={goToCheckout}
                  disabled={checkoutBusy}
                  aria-busy={checkoutBusy}
                >
                  {checkoutBusy ? "Opening Checkout" : "Continue to Checkout"}
                </button>
                {checkoutError && <p className="tfc-error" role="alert">{checkoutError}</p>}
                <p className="tfc-fine">One free can per order. Shipping is {SHIPPING}.</p>
              </div>
            </section>
          )
        )}
      </main>

      {/* Mobile-only sticky bar once a can is selected (hidden ≥769px in CSS). */}
      {showBar && current && (
        <button type="button" className="tfc-bar" onClick={scrollToClaim}>
          <span className="tfc-bar-dot" style={{ background: current.color }} aria-hidden="true" />
          <span className="tfc-bar-text">{current.flavor} selected</span>
          <span className="tfc-bar-cta">· Claim It →</span>
        </button>
      )}

      <SiteFooter />
    </div>
  );
}
