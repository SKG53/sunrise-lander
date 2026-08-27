import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import sunriseCss from "../styles/sunrise-shell.css?url";
import { useCartSync } from "../hooks/useCartSync";
import { AnnouncementBar } from "../components/AnnouncementBar";
import { SpinWheel } from "../components/SpinWheel";

// Sitewide Organization JSON-LD (schema.org). Minimal, factual fields only —
// no postal address (the only address on file is the BIAB production entity,
// which never appears consumer-facing), no logo or sameAs yet (added later
// once a transparent logo and claimed social URLs exist). `<` is escaped so
// the JSON can't break out of the inline <script> tag.
// Lander JSON-LD: brand identity only. Intentionally declares NO `url` —
// the lander must not assert a machine-readable relationship to the main site.
const ORG_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SUNRISE Beverage",
  email: "hello@savorsunrise.com",
  telephone: "+1-877-674-7459",
}).replace(/</g, "\\u003c");

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Site-wide noindex: this is a burner presell lander for paid traffic —
      // it must not be indexed or cross-associated with savorsunrise.com.
      // (Meta's ad-preview scraper ignores robots, so OG link previews still work.)
      { name: "robots", content: "noindex, nofollow" },
      { title: "SUNRISE — Refresh the way the world drinks" },
      { name: "description", content: "Refresh the way the world drinks." },
      { property: "og:title", content: "SUNRISE" },
      { property: "og:description", content: "Refresh the way the world drinks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "SUNRISE" },
      { name: "twitter:description", content: "Refresh the way the world drinks." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b7ac01c8-034b-4626-b147-8e372b6140e3/id-preview-297a98b0--64ea6beb-3ca0-49b4-8812-c0e9b2b4fe71.lovable.app-1776778303816.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b7ac01c8-034b-4626-b147-8e372b6140e3/id-preview-297a98b0--64ea6beb-3ca0-49b4-8812-c0e9b2b4fe71.lovable.app-1776778303816.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: sunriseCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
      },
    ],
    scripts: [
      {
        children:
          "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NSC2C4CG');",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NSC2C4CG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ORG_JSON_LD }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useCartSync();

  // Option B cross-domain hand-off: once a visitor has actually spun the wheel
  // here (SpinWheel sets localStorage "sunrise:spin-done"), tag every outbound
  // savorsunrise.com link with ?ref=srbev at click time. The main site reads
  // that marker and suppresses its own Spin & Save for these visitors only.
  // Capture-phase so the href is rewritten before navigation; decoupled from
  // any single component so it covers all current and future main-site links.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      try {
        if (localStorage.getItem("sunrise:spin-done") !== "1") return;
      } catch {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.includes("savorsunrise.com")) return;
      if (/[?&]ref=/.test(href)) return; // already tagged
      const sep = href.includes("?") ? "&" : "?";
      anchor.setAttribute("href", `${href}${sep}ref=srbev`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      <AnnouncementBar />
      <Outlet />
      <SpinWheel />
    </>
  );
}
