"use client";

import Link from "next/link";
import { Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatCurrency } from "@/data/products";

export function CartClient() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="container section">
      <div
        className="reveal"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "end",
          marginBottom: 34
        }}
      >
        <div>
          <p className="eyebrow" style={{ color: "#d5001c" }}>
            Inventory Check
          </p>
          <h1 className="display" style={{ margin: "10px 0 0", fontSize: "clamp(2.7rem, 7vw, 5.6rem)" }}>
            Cart
          </h1>
        </div>
        <span className="mono muted">{items.length} item groups</span>
      </div>

      <div className="grid-12">
        <div style={{ gridColumn: "span 8", display: "grid", gap: 24 }}>
          {items.length === 0 ? (
            <div className="panel panel-pad reveal">
              <h2 className="headline" style={{ marginTop: 0 }}>
                Your cart is ready for a new build.
              </h2>
              <Link className="button primary mono" href="/catalog">
                View Catalog
              </Link>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <article key={product.slug} className="panel panel-pad reveal">
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 24, alignItems: "center" }}>
                  <div className="product-image" style={{ aspectRatio: "1 / 1" }}>
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div>
                    <h2 className="headline" style={{ margin: "0 0 8px", fontSize: "1.45rem" }}>
                      {product.name}
                    </h2>
                    <p className="eyebrow" style={{ margin: "0 0 14px" }}>
                      Part No: {product.partNo}
                    </p>
                    <p className="muted" style={{ margin: "0 0 18px", lineHeight: 1.55 }}>
                      {product.short}
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Decrease ${product.name}`}
                        onClick={() => setQuantity(product.slug, quantity - 1)}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span className="mono" style={{ minWidth: 32, textAlign: "center" }}>
                        {String(quantity).padStart(2, "0")}
                      </span>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Increase ${product.name}`}
                        onClick={() => setQuantity(product.slug, quantity + 1)}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 18, justifyItems: "end" }}>
                    <strong className="price">{formatCurrency(product.price * quantity)}</strong>
                    <button
                      className="button ghost mono"
                      type="button"
                      style={{ minHeight: 42, fontSize: 12 }}
                      onClick={() => removeItem(product.slug)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="panel panel-pad reveal" style={{ gridColumn: "span 4", alignSelf: "start" }}>
          <h2 className="headline" style={{ margin: "0 0 24px", fontSize: "1.5rem" }}>
            Spec Summary
          </h2>
          <SummaryLine label="Subtotal" value={formatCurrency(subtotal)} />
          <SummaryLine label="Estimated Tax" value={formatCurrency(tax)} />
          <SummaryLine label="Expedited Shipping" value="Free" />
          <div style={{ borderTop: "1px solid rgba(126,90,86,.32)", marginTop: 20, paddingTop: 24 }}>
            <SummaryLine label="Total" value={formatCurrency(total)} large />
          </div>
          <Link className="button primary mono" href="/checkout" style={{ width: "100%", marginTop: 28 }}>
            Secure Checkout
          </Link>
          <Link className="button ghost mono" href="/catalog" style={{ width: "100%", marginTop: 12 }}>
            Continue Shopping
          </Link>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 14,
              marginTop: 28,
              color: "#8f8381"
            }}
          >
            <TrustItem icon={<ShieldCheck size={18} aria-hidden="true" />} label="Secure" />
            <TrustItem icon={<Truck size={18} aria-hidden="true" />} label="Insured" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryLine({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 18, marginBottom: 18 }}>
      <span className={large ? "headline" : "mono muted"} style={{ textTransform: large ? "uppercase" : undefined }}>
        {label}
      </span>
      <strong className={large ? "price" : "mono"} style={{ fontSize: large ? "1.8rem" : undefined }}>
        {value}
      </strong>
    </div>
  );
}

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ minHeight: 58, display: "grid", placeItems: "center", border: "1px solid rgba(126,90,86,.2)" }}>
      {icon}
      <span className="mono" style={{ fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}
