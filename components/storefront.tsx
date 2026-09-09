"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  Money,
  ShopifyCart,
  ShopifyProduct,
  ShopifyVariant,
} from "@/lib/shopify";

const CART_STORAGE_KEY = "be-unreadable-cart";
const PRIVACY_POLICY_URL = "https://beunreadable.myshopify.com/policies/privacy-policy";

function formatMoney(money: Money) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

function ProductCard({
  addToCart,
  busyVariant,
  product,
}: {
  addToCart: (variant: ShopifyVariant) => Promise<void>;
  busyVariant: string | null;
  product: ShopifyProduct;
}) {
  const firstAvailable =
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(
    firstAvailable?.id ?? "",
  );
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    firstAvailable;
  const hasChoices =
    product.variants.length > 1 ||
    (product.variants[0]?.title && product.variants[0].title !== "Default Title");

  if (!selectedVariant) return null;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        {product.featuredImage ? (
          <img
            alt={product.featuredImage.altText || product.title}
            className="product-image"
            height={product.featuredImage.height ?? 1200}
            loading="lazy"
            src={product.featuredImage.url}
            width={product.featuredImage.width ?? 960}
          />
        ) : null}
      </div>

      <div className="product-info">
        <div className="product-heading-row">
          <h2 className="product-title">{product.title}</h2>
          <span className="product-price">
            {formatMoney(selectedVariant.price)}
          </span>
        </div>
        {product.description ? (
          <p className="product-description">{product.description}</p>
        ) : null}

        <div
          className={`product-controls${hasChoices ? "" : " single-control"}`}
        >
          {hasChoices ? (
            <Select
              onValueChange={setSelectedVariantId}
              value={selectedVariant.id}
            >
              <SelectTrigger
                aria-label={`Choose ${product.title} option`}
                className="variant-trigger"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="variant-menu">
                {product.variants.map((variant) => (
                  <SelectItem
                    disabled={!variant.availableForSale}
                    key={variant.id}
                    value={variant.id}
                  >
                    {variant.title}
                    {!variant.availableForSale ? " — Sold out" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            className="monochrome-button"
            disabled={
              !selectedVariant.availableForSale || busyVariant === selectedVariant.id
            }
            onClick={() => addToCart(selectedVariant)}
          >
            {busyVariant === selectedVariant.id
              ? "Adding"
              : selectedVariant.availableForSale
                ? "Add to bag"
                : "Sold out"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function Storefront({
  products,
  shopConfigured,
}: {
  products: ShopifyProduct[];
  shopConfigured: boolean;
}) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartError, setCartError] = useState("");
  const [busyVariant, setBusyVariant] = useState<string | null>(null);
  const [updatingLine, setUpdatingLine] = useState<string | null>(null);

  useEffect(() => {
    const cartId = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!cartId) return;

    void fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`)
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/");
          return null;
        }
        if (!response.ok) throw new Error("Unable to restore bag");
        return (await response.json()) as { cart: ShopifyCart | null };
      })
      .then((result) => {
        if (result?.cart) setCart(result.cart);
        else window.localStorage.removeItem(CART_STORAGE_KEY);
      })
      .catch(() => window.localStorage.removeItem(CART_STORAGE_KEY));
  }, []);

  const totalQuantity = cart?.totalQuantity ?? 0;
  const cartLines = useMemo(() => cart?.lines.nodes ?? [], [cart]);

  async function addToCart(variant: ShopifyVariant) {
    setBusyVariant(variant.id);
    setCartError("");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cart?.id,
          merchandiseId: variant.id,
          quantity: 1,
        }),
      });
      const result = (await response.json()) as {
        cart?: ShopifyCart;
        message?: string;
      };
      if (!response.ok || !result.cart) {
        throw new Error(result.message ?? "Unable to add this item");
      }

      setCart(result.cart);
      window.localStorage.setItem(CART_STORAGE_KEY, result.cart.id);
      setCartOpen(true);
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "Unable to add item");
      setCartOpen(true);
    } finally {
      setBusyVariant(null);
    }
  }

  async function changeQuantity(lineId: string, quantity: number) {
    if (!cart) return;
    setUpdatingLine(lineId);
    setCartError("");

    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: cart.id, lineId, quantity }),
      });
      const result = (await response.json()) as {
        cart?: ShopifyCart;
        message?: string;
      };
      if (!response.ok || !result.cart) {
        throw new Error(result.message ?? "Unable to update bag");
      }
      setCart(result.cart);
      if (result.cart.totalQuantity === 0) {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "Unable to update bag");
    } finally {
      setUpdatingLine(null);
    }
  }

  return (
    <div className="cinematic-background store-shell">
      <Sheet onOpenChange={setCartOpen} open={cartOpen}>
        <header className="store-header">
          <a className="wordmark" href="/shop">
            Be Unreadable
          </a>
          <SheetTrigger asChild>
            <Button className="bag-button" variant="ghost">
              Bag [{totalQuantity}]
            </Button>
          </SheetTrigger>
        </header>

        <main className="store-main">
          <section className="store-intro">
            <h1 className="brand-title">Be Unreadable</h1>
            <p className="brand-tagline">Identity Over Data</p>
          </section>

          {products.length > 0 ? (
            <section aria-label="Products" className="product-grid">
              {products.map((product) => (
                <ProductCard
                  addToCart={addToCart}
                  busyVariant={busyVariant}
                  key={product.id}
                  product={product}
                />
              ))}
            </section>
          ) : (
            <section className="manifesto">
              <p>
                You are not data.
                <br />
                You are not a pattern.
                <br />
                <br />
                You are what they cannot predict.
              </p>
              {!shopConfigured ? (
                <p className="preview-note">
                  Private preview · Shopify products not connected yet
                </p>
              ) : null}
            </section>
          )}
        </main>

        <footer className="store-footer">
          <a href={PRIVACY_POLICY_URL}>Datenschutz</a>
        </footer>

        <SheetContent className="cart-panel">
          <SheetHeader className="cart-header">
            <SheetTitle className="cart-title">Your bag</SheetTitle>
            <SheetDescription className="cart-description">
              {totalQuantity} {totalQuantity === 1 ? "piece" : "pieces"}
            </SheetDescription>
          </SheetHeader>

          <div className="cart-lines">
            {cartLines.length === 0 ? (
              <p className="cart-empty">Your bag is empty.</p>
            ) : (
              cartLines.map((line) => (
                <article className="cart-line" key={line.id}>
                  {line.merchandise.product.featuredImage ? (
                    <img
                      alt={line.merchandise.product.featuredImage.altText || line.merchandise.product.title}
                      className="cart-line-image"
                      height={92}
                      src={line.merchandise.product.featuredImage.url}
                      width={74}
                    />
                  ) : (
                    <div className="cart-line-image" />
                  )}
                  <div>
                    <h3 className="cart-line-title">{line.merchandise.product.title}</h3>
                    {line.merchandise.title !== "Default Title" ? (
                      <p className="cart-line-variant">{line.merchandise.title}</p>
                    ) : null}
                    <p className="cart-line-price">{formatMoney(line.cost.totalAmount)}</p>
                    <div className="quantity-row">
                      <button
                        aria-label={`Decrease ${line.merchandise.product.title} quantity`}
                        className="quantity-button"
                        disabled={updatingLine === line.id}
                        onClick={() => changeQuantity(line.id, line.quantity - 1)}
                        type="button"
                      >−</button>
                      <span>{line.quantity}</span>
                      <button
                        aria-label={`Increase ${line.merchandise.product.title} quantity`}
                        className="quantity-button"
                        disabled={updatingLine === line.id}
                        onClick={() => changeQuantity(line.id, line.quantity + 1)}
                        type="button"
                      >+</button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <SheetFooter className="cart-footer">
            {cartError ? <p className="cart-error">{cartError}</p> : null}
            {cart ? (
              <>
                <div className="cart-total">
                  <span>Total</span>
                  <span>{formatMoney(cart.cost.totalAmount)}</span>
                </div>
                <Button
                  className="monochrome-button"
                  disabled={cart.totalQuantity === 0}
                  onClick={() => window.location.assign(cart.checkoutUrl)}
                >Checkout</Button>
              </>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
