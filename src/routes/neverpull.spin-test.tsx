// LIVE, ISOLATED test hub: the new two-pool Spin & Save (V2) popups, plus links
// to every lander prototype, grouped and color-coded by what is being tested
// (Oct 12 2026):
//   1. Spin & Save popups (red)    — open ON this page: wheel, B2G1F ad, 25OFF5 ad
//   2. Deal landing pages (green)  — /neverpull/tryfreecan, /neverpull/buy1get2,
//                                    /neverpull/buy3get2
//   3. Customer pages (purple)     — /neverpull/review, /neverpull/account-test
// Path: /neverpull/spin-test  (srbev.com is site-wide noindex; this route also
// carries its own noindex and is not linked from anywhere).
//
// Popups: click a red button and the wheel opens here — play with the full
// spin → spin-again → keep-one → email → code flow. NO backend — the test wheel
// writes nothing to Supabase or HubSpot (see SpinWheelV2.submitEmail).
// The lander's legacy global SpinWheel (mounted in __root, auto-arms on
// non-splash routes) is suppressed here so only the popup under test appears.
// To add a prototype: add one entry to the right group in GROUPS.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { SpinWheelV2 } from "../components/SpinWheelV2";
import "./spin-test.css";

export const Route = createFileRoute("/neverpull/spin-test")({
  component: SpinTestPage,
  head: () => ({
    meta: [
      { title: "Spin & Save — Test · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type LaunchMode = "wheel" | "b2g1f" | "25off5";

type Item =
  | { kind: "popup"; mode: LaunchMode; label: string }
  | {
      kind: "page";
      to:
        | "/neverpull/tryfreecan"
        | "/neverpull/buy1get2"
        | "/neverpull/buy3get2"
        | "/neverpull/review"
        | "/neverpull/account-test";
      label: string;
    };

const GROUPS: { title: string; note: string; color: string; items: Item[] }[] = [
  {
    title: "Spin & Save popups",
    note: "Open on this page.",
    color: "#CC1F39",
    items: [
      { kind: "popup", mode: "wheel", label: "Spin & Save wheel" },
      { kind: "popup", mode: "b2g1f", label: "Ad visitor · B2G1F" },
      { kind: "popup", mode: "25off5", label: "Ad visitor · 25OFF5" },
    ],
  },
  {
    title: "Deal landing pages",
    note: "Meta ad destinations. Open a new page.",
    color: "#0A6034",
    items: [
      { kind: "page", to: "/neverpull/tryfreecan", label: "Free Can" },
      { kind: "page", to: "/neverpull/buy1get2", label: "Buy 1 Get 2 Free" },
      { kind: "page", to: "/neverpull/buy3get2", label: "Buy 3 Get 2 Free" },
    ],
  },
  {
    title: "Customer pages",
    note: "Reviews and accounts. Open a new page.",
    color: "#2E1E3D",
    items: [
      { kind: "page", to: "/neverpull/review", label: "Review Request" },
      { kind: "page", to: "/neverpull/account-test", label: "Customer Accounts" },
    ],
  },
];

function SpinTestPage() {
  // launch: null = nothing open. `mode` picks which popup mounts; bumping `id`
  // remounts a fresh instance so you can reopen or switch between the wheel and
  // the two deal-specific ad popups.
  const [launch, setLaunch] = useState<{ id: number; mode: LaunchMode } | null>(
    null,
  );
  const open = (mode: LaunchMode) =>
    setLaunch((l) => ({ id: (l?.id ?? 0) + 1, mode }));

  // Suppress the lander's legacy global SpinWheel on this route only, so the page
  // shows just the popup under test. Runs before the sibling <SpinWheel /> effect
  // in __root (earlier child). Per-session only.
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* private browsing — harmless */
    }
  }, []);

  return (
    <main className="st-page">
      <header className="st-head">
        <p className="st-kicker">neverpull · not public</p>
        <h1 className="st-title">Test Hub</h1>
      </header>

      {GROUPS.map((g) => (
        <section
          key={g.title}
          className="st-group"
          style={{ "--st-color": g.color } as CSSProperties}
          aria-labelledby={`st-${g.title}`}
        >
          <div className="st-group-head">
            <h2 id={`st-${g.title}`} className="st-group-title">{g.title}</h2>
            <p className="st-group-note">{g.note}</p>
          </div>
          <div className="st-buttons">
            {g.items.map((it) =>
              it.kind === "popup" ? (
                <button key={it.label} type="button" className="st-btn" onClick={() => open(it.mode)}>
                  {it.mode === "wheel" && launch !== null ? "Reopen Spin & Save" : it.label}
                </button>
              ) : (
                <Link key={it.label} to={it.to} className="st-btn">
                  {it.label}
                  <span className="st-arrow" aria-hidden="true">→</span>
                </Link>
              ),
            )}
          </div>
        </section>
      ))}

      {launch && (
        <SpinWheelV2
          forceOpen
          adDealKey={launch.mode === "wheel" ? undefined : launch.mode}
          key={launch.id}
        />
      )}
    </main>
  );
}
