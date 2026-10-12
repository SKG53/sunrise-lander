// BUY 3 GET 2 FREE — lander prototype (Meta deal page). Path: /neverpull/buy3get2
// srbev.com is site-wide noindex; this route also carries its own noindex.
// Linked only from the /neverpull/spin-test button page.
// Brief: SUNRISE_WebDesign_Lander_BuildYourBox_Prototypes_2026-10-11.
// The whole page body (box, grid, email, reveal, checkout) and the standing
// rule table live in components/BuildYourBox.tsx. Only the box size, copy and
// code differ from /neverpull/buy1get2. TEST_MODE: writes nothing.

import { createFileRoute } from "@tanstack/react-router";
import { BuildYourBox } from "../components/BuildYourBox";

export const Route = createFileRoute("/neverpull/buy3get2")({
  component: Buy3Get2Page,
  head: () => ({
    meta: [
      { title: "Buy 3 Get 2 Free · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Buy3Get2Page() {
  return (
    <BuildYourBox
      paidSlots={3}
      freeSlots={2}
      headline="Buy 3. Get 2 Free."
      subline="Add any three 4-packs. We'll add two Perfect Buzz 4-packs, on us."
      code="TEST_B3G2"
      storageKey="sunrise:buy3get2"
      logTag="buy3get2"
    />
  );
}
