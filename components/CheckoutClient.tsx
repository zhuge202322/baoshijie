"use client";

import Link from "next/link";
import { LockKeyhole, PackageOpen, ShieldCheck, Truck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { AirwallexCheckout } from "@/components/checkout/AirwallexCheckout";
import { PaymentSelector } from "@/components/checkout/PaymentSelector";
import { PayPalCheckout } from "@/components/checkout/PayPalCheckout";
import type { CheckoutSession, PaymentConfig } from "@/components/checkout/types";
import { checkoutCountries } from "@/lib/checkout/countries";
import { formatUsd } from "@/lib/catalog/model";
import type { ShippingRates } from "@/lib/checkout/shipping";

export function CheckoutClient({ paymentConfig, shippingRates }: { paymentConfig: PaymentConfig; shippingRates: ShippingRates }) {
  const shippingOptions = [
    { id: "standard" as const, label: "Standard Shipping", detail: "5-7 business days", priceCents: shippingRates.standard },
    { id: "expedited" as const, label: "Premium Expedited Air", detail: "2-4 business days", priceCents: shippingRates.expedited }
  ];
  const { items, lines, subtotalCents, hydrated } = useCart();
  const [shippingMethod, setShippingMethod] = useState<"standard" | "expedited">("standard");
  const [countryCode, setCountryCode] = useState("US");
  const [paymentProvider, setPaymentProvider] = useState<"paypal" | "airwallex" | "">(
    paymentConfig.paypal.available ? "paypal" : paymentConfig.airwallex.available ? "airwallex" : ""
  );
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const selectedShipping = shippingOptions.find((option) => option.id === shippingMethod) || shippingOptions[0];
  const displayTotals = session?.totals || {
    currency: "USD" as const,
    subtotalCents,
    shippingCents: selectedShipping.priceCents,
    totalCents: subtotalCents + selectedShipping.priceCents
  };
  const requiresRegion = countryCode === "US" || countryCode === "CA";
  const providersAvailable = paymentConfig.paypal.available || paymentConfig.airwallex.available;
  const orderButton = paymentProvider === "paypal" ? "Continue to PayPal" : "Continue to secure card payment";

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentProvider || pending || session) return;
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          shippingMethod,
          paymentProvider,
          customer: {
            email: data.get("email"),
            phone: data.get("phone"),
            firstName: data.get("firstName"),
            lastName: data.get("lastName"),
            countryCode: data.get("countryCode"),
            region: data.get("region"),
            city: data.get("city"),
            postalCode: data.get("postalCode"),
            addressLine1: data.get("addressLine1"),
            addressLine2: data.get("addressLine2"),
            customerNote: data.get("customerNote")
          }
        })
      });
      const body = await response.json() as CheckoutSession & { error?: string };
      if (!response.ok) throw new Error(body.error || "Order could not be created");
      setSession(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order could not be created");
    } finally {
      setPending(false);
    }
  }

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  if (!hydrated) return <div className="container section checkout-loading" aria-live="polite">Loading checkout...</div>;
  if (items.length === 0) {
    return (
      <div className="container section checkout-empty">
        <PackageOpen size={34} aria-hidden="true" />
        <h1 className="headline">Your cart is empty</h1>
        <p className="muted">Add a component before starting checkout.</p>
        <Link className="button primary mono" href="/catalog">Browse catalog</Link>
      </div>
    );
  }

  return (
    <div className="container section checkout-page">
      <header className="checkout-header"><p className="eyebrow">Guest checkout</p><h1 className="display">Secure Checkout</h1><p className="muted">{itemCount} {itemCount === 1 ? "item" : "items"} · USD</p></header>
      <form className="checkout-layout" onSubmit={createOrder}>
        <div className="checkout-details" aria-disabled={Boolean(session)}>
          <CheckoutSection number="01" title="Contact and delivery">
            <div className="checkout-fields">
              <Field label="Email" name="email" type="email" autoComplete="email" required disabled={Boolean(session)} />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required disabled={Boolean(session)} />
              <Field label="First name" name="firstName" autoComplete="given-name" required disabled={Boolean(session)} />
              <Field label="Last name" name="lastName" autoComplete="family-name" required disabled={Boolean(session)} />
              <label className="checkout-field checkout-field-wide">Country or region
                <select name="countryCode" value={countryCode} onChange={(event) => setCountryCode(event.target.value)} disabled={Boolean(session)} required>
                  <option value="" disabled>Select destination</option>
                  {checkoutCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </select>
              </label>
              <Field label="Address" name="addressLine1" autoComplete="address-line1" required wide disabled={Boolean(session)} />
              <Field label="Apartment, suite, etc." name="addressLine2" autoComplete="address-line2" wide disabled={Boolean(session)} />
              <Field label="City" name="city" autoComplete="address-level2" required disabled={Boolean(session)} />
              <Field label={countryCode === "US" ? "State" : countryCode === "CA" ? "Province" : "Region"} name="region" autoComplete="address-level1" required={requiresRegion} disabled={Boolean(session)} />
              <Field label="Postal code" name="postalCode" autoComplete="postal-code" required disabled={Boolean(session)} />
              <label className="checkout-field checkout-field-wide">Order note<textarea name="customerNote" rows={3} maxLength={2000} disabled={Boolean(session)} /></label>
            </div>
          </CheckoutSection>

          <CheckoutSection number="02" title="Shipping">
            <div className="checkout-shipping-options">
              {shippingOptions.map((option) => (
                <label key={option.id} className={shippingMethod === option.id ? "is-selected" : ""}>
                  <input type="radio" name="shippingMethod" value={option.id} checked={shippingMethod === option.id} onChange={() => setShippingMethod(option.id)} disabled={Boolean(session)} />
                  <span><strong>{option.label}</strong><small>{option.detail} · tracked delivery</small></span>
                  <strong>{formatUsd(option.priceCents)}</strong>
                </label>
              ))}
            </div>
          </CheckoutSection>

          <CheckoutSection number="03" title="Payment">
            <PaymentSelector config={paymentConfig} value={paymentProvider} onChange={setPaymentProvider} disabled={Boolean(session)} />
            {!providersAvailable ? <p className="checkout-provider-note">Payment providers are not configured yet. Checkout will become available after server credentials are added.</p> : null}
            {error ? <p className="checkout-error" role="alert">{error}</p> : null}
            {!session ? (
              <button className="button primary mono checkout-submit" type="submit" disabled={!paymentProvider || pending}>
                <LockKeyhole size={17} aria-hidden="true" />{pending ? "Creating secure order..." : orderButton}
              </button>
            ) : (
              <div className="checkout-hosted-stage">
                <p className="mono">Order {session.orderNumber}</p>
                {session.paymentProvider === "paypal" ? <PayPalCheckout session={session} clientId={paymentConfig.paypal.clientId} /> : null}
                {session.paymentProvider === "airwallex" ? <AirwallexCheckout session={session} environment={paymentConfig.airwallex.environment} /> : null}
              </div>
            )}
          </CheckoutSection>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-title"><LockKeyhole size={19} aria-hidden="true" /><h2>Order summary</h2></div>
          <div className="checkout-summary-items">{items.map(({ product, quantity }) => (
            <div key={product.slug} className="checkout-summary-item">
              <img src={product.image} alt="" />
              <span><strong>{product.name}</strong><small>{product.partNo} · Qty {quantity}</small></span>
              <strong>{formatUsd(product.priceCents * quantity)}</strong>
            </div>
          ))}</div>
          <div className="checkout-totals">
            <Summary label="Subtotal" value={formatUsd(displayTotals.subtotalCents)} />
            <Summary label="Shipping" value={formatUsd(displayTotals.shippingCents)} />
            <Summary label="Total" value={formatUsd(displayTotals.totalCents)} large />
          </div>
          <div className="checkout-trust"><span><ShieldCheck size={17} /> Hosted payment</span><span><Truck size={17} /> Tracked shipping</span></div>
        </aside>
      </form>
    </div>
  );
}

function CheckoutSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="checkout-section"><div className="checkout-section-title"><span className="mono">{number}</span><h2>{title}</h2></div>{children}</section>;
}

function Field({ label, name, wide, ...props }: { label: string; name: string; wide?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`checkout-field ${wide ? "checkout-field-wide" : ""}`}>{label}<input name={name} {...props} /></label>;
}

function Summary({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return <div className={large ? "is-total" : ""}><span>{label}</span><strong>{value}</strong></div>;
}
