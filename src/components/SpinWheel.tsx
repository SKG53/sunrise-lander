// SPIN-TO-WIN — marketing popup for the srbev.com presell lander. Ported from
// the main site (savorsunrise.com) and kept visually/behaviorally identical,
// with two deliberate differences noted below. Free to spin; the discount code
// is masked until the visitor submits an email.
//
// FLOW: idle → spinning (4s) → won (prize shown, code masked, email form)
//       → revealed (code + copy button + shop link).
//
// PERSISTENCE: per-session (sessionStorage STORAGE_KEY). Abuse control lives in
// Shopify — each code is limited to one use per customer — so a new browsing
// session re-showing the wheel costs nothing.
//
// GATING (differs from main): the lander has NO age gate. Rather than showing
// on mount, the popup is delayed so it never interrupts cold paid traffic — it
// appears on the first of: scroll past 65% of the hero cards, a 6s fallback, or
// desktop exit-intent, after a 4s floor. The "Shop the whole collection" button
// opens it immediately (bypassing the floor). Shows once per session.
//
// CROSS-DOMAIN MARKER (lander-only): on reward reveal we set localStorage
// SPIN_DONE_KEY. __root reads it to append ?ref=srbev to outbound
// savorsunrise.com links, so the main site suppresses its own Spin & Save for
// visitors who actually spun here (and only them).
//
// OUTCOME: chosen up front from PRIZES via weighted random, then the final
// rotation is computed to land that segment under the pointer. The animation
// never decides the prize.
//
// DISMISSABLE: marketing, not compliance — X button, ESC and backdrop click
// all close it.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";
import "./SpinWheel.css";

const STORAGE_KEY = "sunrise:spin-wheel-seen";
// Set on the main site (savorsunrise.com) when a visitor arrives with ?ref=srbev,
// i.e. after they spun HERE. Written to localStorage on reveal (below) so the
// __root click handler can tag outbound main-site links. Lander itself only
// uses the per-session STORAGE_KEY above.
const SPIN_DONE_KEY = "sunrise:spin-done";

// ── PRIZE TABLE ─────────────────────────────────────────────────────────
// Ten wheel segments. The wheel is split across five prizes:
// 5% (2 segments), 10% (2), 15% (2), 20% (2), and Free Shipping (2).
// The same prize always uses the same color, and no identical prize is ever
// adjacent. `weight` controls likelihood of THAT SEGMENT; the true odds are
// the sum of that prize's segment weights over the total.
//
// Current odds: Free Shipping 20%, 5% 35%, 10% 25%, 15% 11%, 20% 9%.
//
// Recommended Shopify setup per code: "Limit to one use per customer" +
// require customer email at checkout.
export type Prize = {
  label: string;
  sub: string;
  code: string;
  color: string;
  weight: number;
};

// The five colors are brand-adjacent: the four hero tier colors plus plum
// for the 5% slice. `weight` is per segment; multiply by segment count
// to get each prize's contribution to the total. Adjust any numbers freely.
export const PRIZES: Prize[] = [
  { label: "5%", sub: "OFF", code: "SRSPINWIN5OFF", color: "#822665", weight: 15 },
  { label: "10%", sub: "OFF", code: "SRSPINWIN10OFF", color: "#DC7F27", weight: 35 },
  { label: "15%", sub: "OFF", code: "SRSPINWIN15OFF", color: "#CC1F39", weight: 20 },
  { label: "FREE", sub: "SHIPPING", code: "SRSPINFREESHIP", color: "#2E1E3D", weight: 20 },
  { label: "20%", sub: "OFF", code: "SRSPINWIN20OFF", color: "#0A6034", weight: 10 },
  { label: "5%", sub: "OFF", code: "SRSPINWIN5OFF", color: "#822665", weight: 15 },
  { label: "10%", sub: "OFF", code: "SRSPINWIN10OFF", color: "#DC7F27", weight: 35 },
  { label: "15%", sub: "OFF", code: "SRSPINWIN15OFF", color: "#CC1F39", weight: 20 },
  { label: "FREE", sub: "SHIPPING", code: "SRSPINFREESHIP", color: "#2E1E3D", weight: 20 },
  { label: "20%", sub: "OFF", code: "SRSPINWIN20OFF", color: "#0A6034", weight: 10 },
];

const SEG = 360 / PRIZES.length;
const SPIN_MS = 4200;
const TURNS = 6;

type Phase = "hidden" | "idle" | "spinning" | "won" | "revealed";

// Weighted pick over PRIZES; returns the winning segment INDEX.
function pickIndex(): number {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

// Polar → cartesian with 0° at 12 o'clock, angles increasing clockwise.
function pt(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function segmentPath(i: number) {
  const a0 = i * SEG;
  const a1 = a0 + SEG;
  const [x0, y0] = pt(100, 100, 94, a0);
  const [x1, y1] = pt(100, 100, 94, a1);
  return `M 100 100 L ${x0.toFixed(2)} ${y0.toFixed(2)} A 94 94 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function PrizeWithFireworks({ prize }: { prize: Prize }) {
  const bursts = [
    { top: "40%", left: "24%", color: "var(--tier-5)", delay: "0s" },
    { top: "34%", left: "70%", color: "var(--tier-10)", delay: "0.12s" },
    { top: "64%", left: "52%", color: "var(--tier-30)", delay: "0.28s" },
    { top: "48%", left: "46%", color: "var(--tier-60)", delay: "0.08s" },
  ];
  return (
    <div className="spin-prize-wrap">
      <div className="spin-fireworks" aria-hidden="true">
        {bursts.map((b, i) => (
          <span
            key={i}
            className="spin-burst"
            style={{ top: b.top, left: b.left, color: b.color, animationDelay: b.delay }}
          >
            {Array.from({ length: 12 }).map((_, j) => (
              <span
                key={j}
                className="spin-particle"
                style={{ "--rotate": `${j * 30}deg` } as CSSProperties}
              />
            ))}
          </span>
        ))}
      </div>
      <p className="spin-prize">
        {prize.label} {prize.sub}
      </p>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SpinWheel() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [winner, setWinner] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduced = useRef(false);
  const wmRef = useRef<HTMLDivElement>(null);
  // Set when the wheel is opened by the "Shop the whole collection" button, so
  // that on close we still honor the original intent and scroll to the picker.
  const pendingScroll = useRef(false);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* private browsing — popup simply reappears next mount */
    }
    setPhase("hidden");
    // If the wheel was opened by the "Shop the whole collection" button, honor
    // that original intent once it closes: smooth-scroll to the picker. The
    // small delay lets the scroll-lock (body overflow) release first.
    if (pendingScroll.current) {
      pendingScroll.current = false;
      window.setTimeout(() => {
        document
          .getElementById("shop-collection")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, []);

  // Show once per session, but never the instant the page loads — an immediate
  // popup on cold paid traffic interrupts before the visitor has seen a can.
  // Triggers (whichever fires first, after a 4s floor): scrolled past 65% of the
  // hero cards, a 6s fallback, or desktop exit-intent (cursor leaves via the top
  // edge). The "Shop the whole collection" button also opens it immediately via
  // the srbev:shop-collection event and bypasses the floor (a click is intent);
  // when the wheel then closes, close() scrolls on to the picker as the button
  // originally promised. Once already seen this session, the button just scrolls.
  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seen = true;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      seen = true;
    }

    const FLOOR_MS = 4000;
    const FALLBACK_MS = 6000;
    const mountedAt = Date.now();
    let done = seen; // once revealed (or already seen), auto-triggers go inert
    const timers: number[] = [];

    const scrollToCollection = () => {
      document
        .getElementById("shop-collection")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const onScroll = () => {
      if (Date.now() - mountedAt < FLOOR_MS) return;
      const el = document.querySelector(".lh-fys-cards");
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Fire once 65% of the cards block has scrolled above the viewport top.
      if (r.top + r.height * 0.65 <= 0) reveal();
    };
    const onMouseOut = (e: MouseEvent) => {
      if (Date.now() - mountedAt < FLOOR_MS) return;
      if (e.relatedTarget) return; // moved to another element, not out of window
      if ((e.clientY ?? 1) <= 0) reveal(); // left via the top edge (exit-intent)
    };
    const onShopIntent = () => {
      if (done) {
        scrollToCollection(); // already seen this session — just honor the scroll
        return;
      }
      pendingScroll.current = true; // scroll to the picker once the wheel closes
      reveal();
    };
    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
      timers.forEach((t) => clearTimeout(t));
    };
    const reveal = () => {
      if (done) return;
      done = true;
      cleanup();
      setPhase((p) => (p === "hidden" ? "idle" : p));
    };

    if (!seen) {
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("mouseout", onMouseOut);
      timers.push(window.setTimeout(reveal, FALLBACK_MS));
    }
    // The Shop button works whether or not the wheel is still eligible.
    window.addEventListener("srbev:shop-collection", onShopIntent);

    return () => {
      cleanup();
      window.removeEventListener("srbev:shop-collection", onShopIntent);
    };
  }, []);

  // Body scroll lock + ESC to dismiss while visible.
  useEffect(() => {
    if (phase === "hidden") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, close]);

  // SUNRISE wordmark, same renderer/treatment as the age gate.
  useEffect(() => {
    if (phase === "hidden") return;
    const paint = () => {
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(getBasePx() * 0.8, "gradient");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [phase]);

  const spin = () => {
    if (phase !== "idle") return;
    const idx = pickIndex();
    setWinner(idx);
    // Land the centre of segment `idx` under the pointer at 12 o'clock.
    const target = TURNS * 360 - (idx * SEG + SEG / 2);
    if (reduced.current) {
      setRotation(-(idx * SEG + SEG / 2));
      setPhase("won");
      return;
    }
    setRotation(target);
    setPhase("spinning");
    window.setTimeout(() => setPhase("won"), SPIN_MS);
  };

  const prize = winner === null ? null : PRIZES[winner];

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "spin-wheel" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      // Non-blocking dual-write to HubSpot (spec v2). Fired in parallel and
      // deliberately NOT awaited — the reward reveal below must never wait on
      // (or fail because of) HubSpot. The Supabase write above remains the sole
      // reward gate. A rejected fetch is swallowed so it can't surface an error.
      fetch("/api/public/spin-wheel-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      }).catch(() => {});
      // Persistently mark that this visitor actually spun HERE. __root reads
      // this to append ?ref=srbev to outbound savorsunrise.com links, and the
      // main site uses that marker to suppress its own Spin & Save (Option B:
      // suppress only people who genuinely spun, not all lander referrals).
      try {
        localStorage.setItem(SPIN_DONE_KEY, "1");
      } catch {
        /* private browsing — marker simply won't persist */
      }
      setPhase("revealed");

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!prize) return;
    try {
      await navigator.clipboard.writeText(prize.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  if (phase === "hidden") return null;

  return (
    <div className="spin" role="dialog" aria-modal="true" aria-labelledby="spin-heading">
      <div className="spin-backdrop" onClick={close} aria-hidden="true" />
      <div className="spin-card">
        <button type="button" className="spin-close" onClick={close} aria-label="Close">
          &times;
        </button>

        <div className="spin-wordmark" ref={wmRef} aria-hidden="true" />
        <h2 id="spin-heading" className="spin-heading">
          Spin &amp; Save
        </h2>

        <div className="spin-wheel-wrap">
          <div className="spin-pointer" aria-hidden="true" />
          <svg
            className="spin-wheel"
            viewBox="0 0 200 200"
            role="img"
            aria-label="Prize wheel with 10 discount segments"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition:
                phase === "spinning"
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
                  : "none",
            }}
          >
            {PRIZES.map((p, i) => (
              <path key={`seg-${i}`} d={segmentPath(i)} fill={p.color} />
            ))}
            {PRIZES.map((p, i) => (
              <g key={`txt-${i}`} transform={`rotate(${i * SEG + SEG / 2} 100 100)`}>
                <text x="100" y="34" className="spin-seg-label" textAnchor="middle">
                  {p.label}
                </text>
                <text
                  x="100"
                  y="48"
                  className={`spin-seg-sub${p.sub.length > 4 ? " spin-seg-sub-long" : ""}`}
                  textAnchor="middle"
                >
                  {p.sub}
                </text>
              </g>
            ))}
            <circle cx="100" cy="100" r="94" className="spin-rim" />
            <circle cx="100" cy="100" r="15" className="spin-hub" />
          </svg>
        </div>

        {phase === "idle" && (
          <>
            <button type="button" className="spin-btn spin-btn-primary" onClick={spin} autoFocus>
              Spin the Wheel
            </button>
            <p className="spin-fine">
              Spin the wheel and save on your first order. Applicable on any
              20 packs or fewer. Exclusions, terms, and conditions apply.
            </p>
          </>
        )}

        {phase === "spinning" && <p className="spin-body">Good luck&hellip;</p>}

        {phase === "won" && prize && (
          <>
            <PrizeWithFireworks prize={prize} />
            <form className="spin-form" onSubmit={submitEmail}>
              <label className="spin-label" htmlFor="spin-email">
                Enter your email and unlock your savings!
              </label>
              <input
                id="spin-email"
                type="email"
                className="spin-input"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="spin-error">{error}</p>}
              <button type="submit" className="spin-btn spin-btn-primary" disabled={submitting}>
                {submitting ? "Unlocking\u2026" : "Unlock My Code"}
              </button>
            </form>
          </>
        )}

        {phase === "revealed" && prize && (
          <>
            <PrizeWithFireworks prize={prize} />
            <button type="button" className="spin-code" onClick={copyCode} title="Copy code">
              <span className="spin-code-text">{prize.code}</span>
              <span className="spin-code-copy">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="spin-copy-icon">
                  <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
            <a className="spin-btn spin-btn-primary" href="/" onClick={close}>
              Shop Now
            </a>
            <p className="spin-fine">
              One use per customer, enter code at checkout. Applicable on any
              20 packs or fewer. Exclusions, terms, and conditions apply.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
