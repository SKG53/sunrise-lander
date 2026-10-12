// /neverpull/account → Shopify's hosted customer accounts. Lander stand-in for
// the main site's future /account route (Customer Accounts test, Oct 12 2026).
// shop.savorsunrise.com/account itself 302s to shopify.com/78418936020/account
// (new customer accounts: sign-in by emailed one-time code, order history,
// tracking, addresses). Redirects on the server (beforeLoad) and, as a fallback,
// in the browser; the visible link covers anything else. No writes.

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

const ACCOUNT_URL = "https://shop.savorsunrise.com/account";

export const Route = createFileRoute("/neverpull/account")({
  beforeLoad: () => {
    throw redirect({ href: ACCOUNT_URL });
  },
  component: AccountRedirect,
  head: () => ({
    meta: [
      { title: "My Account · SUNRISE (neverpull)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AccountRedirect() {
  useEffect(() => {
    window.location.replace(ACCOUNT_URL);
  }, []);
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        background: "var(--cream)",
      }}
    >
      <a href={ACCOUNT_URL} style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
        Continue to My Account
      </a>
    </main>
  );
}
