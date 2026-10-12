// CUSTOMER ACCOUNTS — LIVE, ISOLATED test page (Oct 12 2026).
// Path: /neverpull/account-test (srbev.com is site-wide noindex; this route also
// carries its own noindex). Linked only from the /neverpull/spin-test hub.
//
// Purpose: try the account entry point before it goes on savorsunrise.com.
// Shopify customer accounts are ALREADY live for the store (new customer
// accounts; login links already show at checkout) — this page only tests OUR
// side: the header account icon (SiteHeader `accountHref`), the "My Account"
// button in the mobile drawer, and the redirect route (/neverpull/account →
// shop.savorsunrise.com/account → Shopify's hosted account pages).
//
// Main-site build later: same icon + drawer button on main SiteHeader, and a
// /account route on savorsunrise.com doing the same redirect. Nothing here
// writes anything; signing in is a normal customer sign-in.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./account-test.css";

export const Route = createFileRoute("/neverpull/account-test")({
  component: AccountTestPage,
  head: () => ({
    meta: [
      { title: "Customer Accounts — Test · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const ACCOUNT_HREF = "/neverpull/account";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Find it",
    body: "Desktop: the round person icon sits just left of the cart. Mobile: same icon in the header (menu only on phones under 375px wide), and a “My Account” button at the bottom of the menu.",
  },
  {
    title: "Sign in",
    body: "Tap the icon. Shopify asks for an email, then emails a 6-digit code. No password.",
  },
  {
    title: "Order history",
    body: "Use an email that has ordered before. Past orders should be listed; open one to check status, tracking and items.",
  },
  {
    title: "Profile",
    body: "Check name, addresses and the page branding (logo, colors). Branding is changed in Shopify settings, not in site code.",
  },
  {
    title: "Get back",
    body: "Sign out, then use the store link on the Shopify page. Note where it lands.",
  },
];

function AccountTestPage() {
  // Keep the lander's legacy wheel off this page (also in NO_WHEEL_PATHS).
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* harmless */
    }
  }, []);

  return (
    <>
      <SiteHeader accountHref={ACCOUNT_HREF} />
      <main className="act-page">
        <div className="container act-wrap">
          <p className="act-kicker">Test page · not public</p>
          <h1 className="act-title">Customer Accounts</h1>
          <p className="act-lede">
            This header has the account icon we&rsquo;d add to savorsunrise.com. Everything behind
            it is Shopify&rsquo;s live customer account system, so what you see is what customers
            would see.
          </p>
          <ol className="act-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="act-step">
                <span className="act-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h2 className="act-step-title">{s.title}</h2>
                  <p className="act-step-body">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <a href={ACCOUNT_HREF} className="btn btn-primary act-cta">
            Open My Account
          </a>
          <p className="act-note">
            Signing in only reads your account. Nothing on savorsunrise.com changes.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
