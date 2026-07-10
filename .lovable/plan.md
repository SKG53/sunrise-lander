# Make the site read-only against Shopify

Goal: the site can still pull product info (names, prices, images, descriptions, variants) from Shopify, but never writes anything back — no cart creation, no line item add/remove/update, no checkout session creation.

## What gets removed

1. **Cart mutations in `src/lib/shopify.ts`**
   - Delete `cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove` calls and their exported helpers.
   - Keep the read query helpers (product fetch, product-by-handle, collections, etc.).

2. **Cart state (`src/stores/cartStore.ts` or equivalent)**
   - Remove logic that calls Shopify to sync the cart.
   - Either delete the store entirely, or keep it as a local-only "wishlist"-style store with no Shopify calls (see question below).

3. **Cart UI**
   - Remove the cart drawer/sheet, cart icon badge, and cart route if present.
   - Remove "Add to Cart" and quantity steppers from product pages.
   - Remove "Checkout" buttons that generate a Shopify checkout URL.

4. **Product page (`src/routes/products_.$slug.tsx`) and listing (`src/routes/products.tsx`)**
   - Keep name, description, images, price display, variant display.
   - Replace the Add to Cart / Checkout section with the chosen CTA (see question below).

## What stays

- `src/lib/shopify.ts` read queries via Storefront API.
- Product listing and product detail routes as info-only pages.
- All existing styling, hero, marketing sections.

## Open question before I build

What should replace the Add to Cart / Checkout buttons on product pages?
- **A. "Shop on main site" external link** — needs the main site URL (and whether to deep-link per product or send everyone to the homepage).
- **B. Plain info pages** — no CTA button at all.
- **C. Contact / inquiry CTA** — e.g. "Contact us" mailto or link to a contact route.

Once you pick, I'll implement in one pass and verify the build has no remaining Shopify write calls.
