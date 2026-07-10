// Shopify Storefront API helper — READ ONLY.
// This site only fetches product data from Shopify. All cart/checkout
// mutations are intentionally no-ops so nothing is ever written back to the
// Shopify store. Add-to-cart buttons in the UI therefore do nothing.

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "30dfrv-hs.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "57d9eebab19ddb5f3b3d1e5dcd320b20";

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    descriptionHtml: string;
    handle: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: ShopifyImage }> };
    variants: { edges: Array<{ node: ShopifyVariant }> };
    options: Array<{ name: string; values: string[] }>;
  };
}

export async function storefrontApiRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ data?: T; errors?: Array<{ message: string }> } | null> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    console.error("Shopify: Payment required");
    return null;
  }

  if (!response.ok) {
    throw new Error(`Shopify API HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Shopify API: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
  }
  return json;
}

// ── PRODUCT QUERY ───────────────────────────────────────────────────────
const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      descriptionHtml
      handle
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 5) { edges { node { url altText } } }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price { amount currencyCode }
            availableForSale
            selectedOptions { name value }
          }
        }
      }
      options { name values }
    }
  }
`;

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest<{ product: ShopifyProduct["node"] | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle }
  );
  if (!data?.data?.product) return null;
  return { node: data.data.product };
}

// ── CART MUTATIONS (DISABLED) ───────────────────────────────────────────
// This is a lite lander site. It must never write to Shopify.
// The functions below preserve their original signatures so existing
// callers (cart store, product page) still typecheck, but every call is a
// no-op that reports failure. UI "Add to Cart" buttons therefore do
// nothing when clicked.

export const CART_QUERY = "";

export async function createShopifyCart(
  _variantId: string,
  _quantity: number
): Promise<{ cartId: string; checkoutUrl: string; lineId: string } | null> {
  return null;
}

export async function addLineToShopifyCart(
  _cartId: string,
  _variantId: string,
  _quantity: number
): Promise<{ success: boolean; lineId?: string; cartNotFound?: boolean }> {
  return { success: false };
}

export async function updateShopifyCartLine(
  _cartId: string,
  _lineId: string,
  _quantity: number
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  return { success: false };
}

export async function removeLineFromShopifyCart(
  _cartId: string,
  _lineId: string
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  return { success: false };
}