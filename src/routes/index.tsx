import { createFileRoute } from "@tanstack/react-router";
import "./index.css";

// ─────────────────────────────────────────────────────────────────────────
// SUNRISE LANDER — HOME ( / )
// This is the lander's real landing page: the default page the site opens to.
// Intentionally BLANK — a clean canvas we build up collaboratively.
//
// Notes for whoever picks this up:
//  • The previous (cloned main-store) home is preserved verbatim at /oghome.
//  • No SiteHeader / SiteFooter / nav here on purpose — a thin presell doesn't
//    inherit the store's nav + cart machinery. We add only what the presell
//    needs when we fill this in.
//  • No canonical / JSON-LD identity yet — the lander's SEO identity is an open
//    decision (repoint to lander domain vs. noindex). Do NOT point it at
//    savorsunrise.com. See SBev_BC_SRLander_Unified_Handoff.md §0.3.
// ─────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/")({
  component: LanderHome,
  head: () => ({
    meta: [
      { title: "SUNRISE" },
      { name: "description", content: "" },
    ],
  }),
});

function LanderHome() {
  return (
    <main className="lander-home">
      {/* BUILD HERE — lander presell home. */}
    </main>
  );
}
