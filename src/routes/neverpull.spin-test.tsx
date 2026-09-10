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
import { useEffect, useState } from "react";
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

function SpinTestPage() {
  // runId: 0 = not launched. Bumping it mounts a fresh wheel (opens it) and lets
  // you reopen after closing.
  const [runId, setRunId] = useState(0);

  // Suppress the lander's legacy global SpinWheel on this route only, so the page
  // shows just the new wheel. Runs before the sibling <SpinWheel /> effect in
  // __root (earlier child). Per-session only.
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* private browsing — harmless */
    }
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream, #f7efe0)",
        padding: "2rem",
      }}
    >
      <button
        type="button"
        onClick={() => setRunId((n) => n + 1)}
        style={{
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
        }}
      >
        {runId === 0 ? "Open Spin & Save" : "Reopen Spin & Save"}
      </button>

      {runId > 0 && <SpinWheelV2 forceOpen key={runId} />}
    </main>
  );
}
