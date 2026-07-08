"use client";

import { CreditCard, LockKeyhole, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatCurrency } from "@/data/products";

const shippingOptions = [
  { label: "Premium Expedited Air", detail: "2-4 Business Days", price: 45 },
  { label: "Standard Ground", detail: "5-7 Business Days", price: 12 }
];

export function CheckoutClient() {
  const { items, subtotal } = useCart();
  const [shipping, setShipping] = useState(shippingOptions[0]);
  const total = useMemo(() => subtotal + shipping.price, [shipping.price, subtotal]);

  return (
    <div className="container section">
      <div className="grid-12">
        <div style={{ gridColumn: "span 7" }}>
          <div className="reveal" style={{ display: "grid", gap: 44 }}>
            <CheckoutStep number="01" title="Shipping Details">
              <div className="form-grid">
                <Field label="First Name" defaultValue="Ferdinand" />
                <Field label="Last Name" defaultValue="Porsche" />
                <Field label="Address" defaultValue="Porscheplatz 1" wide />
                <Field label="City" defaultValue="Stuttgart" />
                <Field label="Postal Code" defaultValue="70435" />
              </div>
            </CheckoutStep>

            <CheckoutStep number="02" title="Delivery Logistics">
              <div style={{ display: "grid", gap: 14 }}>
                {shippingOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className="panel"
                    onClick={() => setShipping(option)}
                    style={{
                      minHeight: 92,
                      padding: "18px 22px",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 18,
                      alignItems: "center",
                      color: "#f1eeee",
                      cursor: "pointer",
                      borderColor: shipping.label === option.label ? "#d5001c" : "rgba(126,90,86,.34)"
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        border: "1px solid #7e5a56",
                        background: shipping.label === option.label ? "#d5001c" : "transparent"
                      }}
                    />
                    <span style={{ textAlign: "left" }}>
                      <strong>{option.label}</strong>
                      <span className="muted" style={{ display: "block", marginTop: 6 }}>
                        {option.detail} / Insured Tracking
                      </span>
                    </span>
                    <strong>{formatCurrency(option.price)}</strong>
                  </button>
                ))}
              </div>
            </CheckoutStep>

            <CheckoutStep number="03" title="Payment Method">
              <div className="panel panel-pad">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
                  <strong className="mono" style={{ textTransform: "uppercase" }}>
                    Credit or Debit Card
                  </strong>
                  <CreditCard size={22} color="#ffb3ac" aria-hidden="true" />
                </div>
                <div className="form-grid">
                  <Field label="Card Number" defaultValue="4242 4242 4242 4242" wide />
                  <Field label="Expiry" defaultValue="09 / 29" />
                  <Field label="CVC" defaultValue="911" />
                </div>
              </div>
            </CheckoutStep>
          </div>
        </div>

        <aside className="panel panel-pad reveal" style={{ gridColumn: "span 5", alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <LockKeyhole size={20} color="#ffb3ac" aria-hidden="true" />
            <h1 className="headline" style={{ margin: 0, fontSize: "1.55rem" }}>
              Secure Checkout
            </h1>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {items.map(({ product, quantity }) => (
              <div key={product.slug} style={{ display: "grid", gridTemplateColumns: "96px 1fr auto", gap: 16 }}>
                <div className="product-image" style={{ aspectRatio: "1 / 1" }}>
                  <img src={product.image} alt={product.name} />
                </div>
                <div>
                  <p className="eyebrow" style={{ margin: "0 0 6px" }}>
                    Part {product.partNo}
                  </p>
                  <strong className="headline" style={{ fontSize: "1rem" }}>
                    {product.name}
                  </strong>
                  <p className="muted mono" style={{ margin: "8px 0 0", fontSize: 12 }}>
                    Qty: {quantity}
                  </p>
                </div>
                <strong>{formatCurrency(product.price * quantity)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(126,90,86,.32)", marginTop: 28, paddingTop: 24 }}>
            <Summary label="Subtotal" value={formatCurrency(subtotal)} />
            <Summary label="Shipping" value={formatCurrency(shipping.price)} />
            <Summary label="Tax" value="$0" />
            <Summary label="Total" value={formatCurrency(total)} large />
          </div>

          <button className="button primary mono" type="button" style={{ width: "100%", marginTop: 24 }}>
            Complete Acquisition
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginTop: 28,
              color: "#c9b8b6"
            }}
          >
            <Trust icon={<ShieldCheck size={18} aria-hidden="true" />} label="Secured" />
            <Trust icon={<CreditCard size={18} aria-hidden="true" />} label="Precision" />
            <Trust icon={<Truck size={18} aria-hidden="true" />} label="Insured" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckoutStep({
  number,
  title,
  children
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="headline" style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 22px" }}>
        <span
          className="mono"
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: "#353534",
            border: "1px solid #7e5a56",
            fontSize: 13
          }}
        >
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, defaultValue, wide = false }: { label: string; defaultValue: string; wide?: boolean }) {
  return (
    <div className="field" style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <label>{label}</label>
      <input defaultValue={defaultValue} />
    </div>
  );
}

function Summary({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
      <span className={large ? "headline" : "muted"}>{label}</span>
      <strong className={large ? "price" : undefined} style={{ fontSize: large ? "1.6rem" : undefined }}>
        {value}
      </strong>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ minHeight: 58, display: "grid", placeItems: "center", border: "1px solid rgba(126,90,86,.18)" }}>
      {icon}
      <span className="mono" style={{ fontSize: 10, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}
