// Site-wide announcement bar. Mounted in __root.tsx so it renders above the
// sticky header on every route. A single evergreen free-shipping line on the
// gold field, linking to the savorsunrise.com store.
//
// (The rotating Labor Day sale slide + fireworks were removed when the sale
// ended; restore from git history for a future promo.) Styling lives in
// sunrise-shell.css under ANNOUNCEMENT BAR.

export function AnnouncementBar() {
  return (
    <div className="announcement-bar" role="region" aria-label="Announcements">
      <div className="announcement-bar-track">
        <a
          href="https://www.savorsunrise.com/products"
          className="announcement-bar-slide is-active"
        >
          Free shipping on all orders{" "}
          <span className="announcement-bar-emph">$75+</span>
        </a>
      </div>
    </div>
  );
}
