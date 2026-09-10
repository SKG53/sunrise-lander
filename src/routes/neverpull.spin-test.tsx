// LIVE, ISOLATED TEST route for the new two-pool Spin & Save (V2).
// Path: /neverpull/spin-test  (srbev.com is site-wide noindex; this route is
// not linked from anywhere and carries an extra noindex for good measure).
//
// It renders ONLY the new wheel (SpinWheelV2, forced open) so the founder can
// exercise the full spin → spin-again → keep-one → email → code flow on a real
// link without touching the live paid funnel. The lander's legacy global
// SpinWheel (mounted in __root, auto-arms on non-splash routes via a 6s
// fallback) is suppressed here by marking its per-session "seen" flag before
// that sibling's effect runs — so the test page shows the new wheel only.

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
  // Bumping the key remounts SpinWheelV2 fresh (re-opens it) for another run.
  const [runId, setRunId] = useState(0);

  // Suppress the lander's legacy global SpinWheel on this route only. This runs
  // before the sibling <SpinWheel /> effect in __root (earlier child), so the
  // old wheel sees "seen" and stays inert. Per-session (sessionStorage) only.
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* private browsing — worst case the old wheel could appear; harmless */
    }
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cream, #f7efe0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontWeight: 900, color: "var(--near-black, #1a1a1a)" }}>
        Spin &amp; Save — Two-Pool Test
      </h1>
      <p style={{ margin: 0, maxWidth: "34rem", color: "var(--text-body, #444)" }}>
        Private test route (noindex, not linked from the live funnel). This is the
        exact new wheel from the main site. Close it and press the button to run
        it again.
      </p>
      <button
        type="button"
        onClick={() => setRunId((n) => n + 1)}
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "0.8rem 1.6rem",
          borderRadius: "9999px",
          border: "2px solid var(--tier-10, #DC7F27)",
          background: "var(--tier-10, #DC7F27)",
          color: "var(--cream, #f7efe0)",
          cursor: "pointer",
        }}
      >
        Launch / Restart Wheel
      </button>

      <SpinWheelV2 forceOpen key={runId} />
    </main>
  );
}
