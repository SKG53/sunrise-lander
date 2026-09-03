// Cream lander header for the presell home route (/). Reuses the shared
// .site-header shell so the cream field, bottom border, sticky offset, and
// bar height are byte-identical to savorsunrise.com. Unlike the main site's
// SiteHeader, the lander carries NO nav links, NO cart, and NO hamburger —
// just the wordmark and two CTAs (COAs + Shop). Mounted in index.tsx only
// (not __root), so the neverpull/policy routes keep their own SiteHeader.
//
// Wordmark paint is copied verbatim from SiteHeader so the logo renders
// identically: gradient variant at 0.69x base on desktop, 0.69x1.26 on
// mobile, repainted on resize and after fonts load.

import { useEffect, useRef } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";

export function LanderHeader() {
  const wmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      // Header wordmark ~26% larger on mobile (0.69 -> 0.87x base); desktop unchanged.
      const headerWm = window.innerWidth <= 768 ? base * 0.69 * 1.26 : base * 0.69;
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(headerWm, "gradient");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  return (
    <header className="site-header lander-header">
      <a href="/" aria-label="SUNRISE home">
        <div className="wordmark-slot" ref={wmRef} />
      </a>

      <div className="nav-right">
        <a
          href="https://marketing8710.wixstudio.com/beverage-manufacture/blank"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-cta outline"
        ><span className="no-transform">COAs</span></a>
        <a href="https://www.savorsunrise.com/products" className="nav-cta solid">Shop</a>
      </div>
    </header>
  );
}
