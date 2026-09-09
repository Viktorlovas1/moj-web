export type Money = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  altText: string | null;
  height: number | null;
  url: string;
  width: number | null;
};

export type ShopifyVariant = {
  availableForSale: boolean;
  id: string;
  price: Money;
  selectedOptions: Array<{ name: string; value: string }>;
  title: string;
};

export type ShopifyProduct = {
  description: string;
  featuredImage: ShopifyImage | null;
  handle: string;
  id: string;
  images: ShopifyImage[];
  title: string;
  variants: ShopifyVariant[];
};

export type ShopifyPolicy = {
  body: string;
  handle: string;
  title: string;
  url: string;
};

export type ShopifyCartLine = {
  cost: { totalAmount: Money };
  id: string;
  merchandise: ShopifyVariant & {
    product: {
      featuredImage: ShopifyImage | null;
      handle: string;
      title: string;
    };
  };
  quantity: number;
};

export type ShopifyCart = {
  checkoutUrl: string;
  cost: { totalAmount: Money };
  id: string;
  lines: { nodes: ShopifyCartLine[] };
  totalQuantity: number;
};

type GraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const cartFragment = `
  fragment CartDetails on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { totalAmount { amount currencyCode } }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
            product {
              title
              handle
              featuredImage { url altText width height }
            }
          }
        }
      }
    }
  }
`;

function getConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim().toLowerCase();
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || "2026-07";

  if (!domain || !token) return null;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain)) {
    throw new Error("SHOPIFY_STORE_DOMAIN must be a myshopify.com domain");
  }

  return { apiVersion, domain, token };
}

async function shopifyFetch<T>(query: string, variables: Record<string, unknown>) {
  const config = getConfig();
  if (!config) throw new Error("Shopify is not configured");

  const response = await fetch(
    `https://${config.domain}/api/${config.apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );

  const result = (await response.json()) as GraphQlResponse<T>;
  if (!response.ok || result.errors?.length) {
    throw new Error(
      result.errors?.map((error) => error.message).join("; ") ||
        `Shopify request failed with ${response.status}`,
    );
  }
  if (!result.data) throw new Error("Shopify returned no data");
  return result.data;
}

function assertNoUserErrors(errors: Array<{ field?: string[]; message: string }>) {
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }
}

export async function getProducts() {
  if (!getConfig()) {
    return { configured: false, products: [] as ShopifyProduct[] };
  }

  const query = `
    query StoreProducts {
      products(first: 20, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          handle
          title
          description
          featuredImage { url altText width height }
          images(first: 6) { nodes { url altText width height } }
          variants(first: 50) {
            nodes {
              id
              title
              availableForSale
              selectedOptions { name value }
              price { amount currencyCode }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    products: {
      nodes: Array<Omit<ShopifyProduct, "images" | "variants"> & {
        images: { nodes: ShopifyImage[] };
        variants: { nodes: ShopifyVariant[] };
      }>;
    };
  }>(query, {});

  return {
    configured: true,
    products: data.products.nodes.map((product) => ({
      ...product,
      images: product.images.nodes,
      variants: product.variants.nodes,
    })),
  };
}

export async function getPrivacyPolicy() {
  if (!getConfig()) {
    return { configured: false, policy: null as ShopifyPolicy | null };
  }

  const query = `
    query PrivacyPolicy @inContext(country: DE, language: DE) {
      shop {
        privacyPolicy {
          body
          handle
          title
          url
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    shop: { privacyPolicy: ShopifyPolicy | null };
  }>(query, {});

  return { configured: true, policy: data.shop.privacyPolicy };
}

export async function getCart(cartId: string) {
  const query = `
    ${cartFragment}
    query Cart($id: ID!) { cart(id: $id) { ...CartDetails } }
  `;
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(query, {
    id: cartId,
  });
  return data.cart;
}

export async function addCartLine(
  merchandiseId: string,
  quantity: number,
  cartId?: string,
) {
  if (!cartId) {
    const mutation = `
      ${cartFragment}
      mutation CreateCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ...CartDetails }
          userErrors { field message }
        }
      }
    `;
    const data = await shopifyFetch<{
      cartCreate: {
        cart: ShopifyCart;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(mutation, {
      input: { lines: [{ merchandiseId, quantity }] },
    });
    assertNoUserErrors(data.cartCreate.userErrors);
    return data.cartCreate.cart;
  }

  const mutation = `
    ${cartFragment}
    mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartDetails }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: ShopifyCart;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(mutation, { cartId, lines: [{ merchandiseId, quantity }] });
  assertNoUserErrors(data.cartLinesAdd.userErrors);
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    const mutation = `
      ${cartFragment}
      mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartDetails }
          userErrors { field message }
        }
      }
    `;
    const data = await shopifyFetch<{
      cartLinesRemove: {
        cart: ShopifyCart;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(mutation, { cartId, lineIds: [lineId] });
    assertNoUserErrors(data.cartLinesRemove.userErrors);
    return data.cartLinesRemove.cart;
  }

  const mutation = `
    ${cartFragment}
    mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartDetails }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCart;
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(mutation, { cartId, lines: [{ id: lineId, quantity }] });
  assertNoUserErrors(data.cartLinesUpdate.userErrors);
  return data.cartLinesUpdate.cart;
}
