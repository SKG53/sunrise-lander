// Minimal lander footer: wordmark + legal bar. Nothing else.
//
// STRIPPED (2026-07-11): the signup form, the Shop / Company / Support /
// Follow columns, the social icons, the /neverpull/social easter egg, and the
// "Consume Responsibly" disclaimer block. What remains is the logo and the
// bottom legal strip.
//
// Two consequences worth knowing:
//   1. The newsletter form POSTed to /api/public/newsletter, an endpoint that
//      was deleted during isolation — it 404'd on every submit. Removing the
//      form closes that loose end.
//   2. Every /neverpull/* link lived in the columns that are now gone. The
//      footer no longer leaks the reference-route prefix into the URL bar of
//      a public page. The three links that remain (Privacy, Accessibility,
//      Terms) are all clean root paths, by design.
//
// The disclaimer's removal is a LEGAL call, not a design one — see the note in
// the chat handoff. Restore it here if Legal requires it on the ad
// destination.

import { useEffect, useRef } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";

export function SiteFooter() {
  const wmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(base * 0.9, "cream");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-row-main">
          <div className="footer-brand-col">
            <div className="wordmark-slot" ref={wmRef} />
          </div>
        </div>

        {/* ── Legal bar ── */}
        {/* Copyright left, secondary legal links right. Mobile (<768px)
            collapses to a single-column stack via the .footer-legal
            flex-direction: column rule in sunrise-shell.css. */}
        <div className="footer-legal">
          <div className="footer-copyright">© 2026 SUNRISE Beverage. All Rights Reserved.</div>
          <ul className="footer-legal-links">
            <li><a href="/privacy-policy">Privacy</a></li>
            <li><a href="/accessibility-statement">Accessibility</a></li>
            <li><a href="/terms-of-service">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
