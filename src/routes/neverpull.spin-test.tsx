// LIVE, ISOLATED playground for the new two-pool Spin & Save (V2).
// Path: /neverpull/spin-test  (srbev.com is site-wide noindex; this route also
// carries its own noindex and is not linked from anywhere).
//
// The whole page is just the popup: click the button, the wheel opens, play with
// the full spin → spin-again → keep-one → email → code flow. NO backend — the
// test wheel writes nothing to Supabase or HubSpot (see SpinWheelV2.submitEmail).
// The lander's legacy global SpinWheel (mounted in __root, auto-arms on non-splash
// routes) is suppressed here so only the new wheel appears.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { SpinWheelV2 } from "../components/SpinWheelV2";

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

  const btn: CSSProperties = {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "1rem 2rem",
    borderRadius: "9999px",
    border: "2px solid var(--tier-10, #DC7F27)",
    background: "var(--tier-10, #DC7F27)",
    color: "var(--cream, #f7efe0)",
    cursor: "pointer",
    fontSize: "1rem",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "var(--cream, #f7efe0)",
        padding: "2rem",
      }}
    >
      <button type="button" onClick={() => open("wheel")} style={btn}>
        {launch === null ? "Open Spin & Save" : "Reopen Spin & Save"}
      </button>
      <button type="button" onClick={() => open("b2g1f")} style={btn}>
        Ad Visitors, B2G1F
      </button>
      <button type="button" onClick={() => open("25off5")} style={btn}>
        Ad Visitors 25OFF5
      </button>

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
