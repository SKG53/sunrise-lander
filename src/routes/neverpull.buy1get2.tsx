// BUY 1 GET 2 FREE — lander prototype (Meta deal page). Path: /neverpull/buy1get2
// srbev.com is site-wide noindex; this route also carries its own noindex.
// Linked only from the /neverpull/spin-test button page.
// Brief: SUNRISE_WebDesign_Lander_BuildYourBox_Prototypes_2026-10-11.
// The whole page body (box, grid, email, reveal, checkout) and the standing
// rule table live in components/BuildYourBox.tsx. Only the box size, copy and
// code differ from /neverpull/buy3get2. TEST_MODE: writes nothing.

import { createFileRoute } from "@tanstack/react-router";
import { BuildYourBox } from "../components/BuildYourBox";

export const Route = createFileRoute("/neverpull/buy1get2")({
  component: Buy1Get2Page,
  head: () => ({
    meta: [
      { title: "Buy 1 Get 2 Free · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Buy1Get2Page() {
  return (
    <BuildYourBox
      paidSlots={1}
      freeSlots={2}
      headline="Buy 1. Get 2 Free."
      subline="Add any 4-pack. We'll add two Perfect Buzz 4-packs, on us."
      code="TEST_B1G2"
      storageKey="sunrise:buy1get2"
      logTag="buy1get2"
    />
  );
}
