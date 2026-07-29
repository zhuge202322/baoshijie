"use client";

import { useEffect, useRef, useState } from "react";
import type { CheckoutSession } from "./types";

type PayPalNamespace = {
  Buttons: (options: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (error: unknown) => void;
    onCancel: () => void;
  }) => { render: (element: HTMLElement) => Promise<void>; close?: () => void };
};

declare global { interface Window { paypal?: PayPalNamespace } }

async function responseJson(response: Response) {
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(body.error || "PayPal request failed"));
  return body;
}

export function PayPalCheckout({ session, clientId }: { session: CheckoutSession; clientId: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let buttons: ReturnType<PayPalNamespace["Buttons"]> | undefined;

    async function mount() {
      let script = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
      if (!script) {
        script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
        script.async = true;
        script.dataset.paypalSdk = "true";
        document.head.appendChild(script);
      }
      if (!window.paypal) {
        await new Promise<void>((resolve, reject) => {
          script?.addEventListener("load", () => resolve(), { once: true });
          script?.addEventListener("error", () => reject(new Error("PayPal checkout could not load")), { once: true });
        });
      }
      if (disposed || !container.current || !window.paypal) return;
      buttons = window.paypal.Buttons({
        style: { layout: "vertical", shape: "rect", height: 46, label: "paypal" },
        createOrder: async () => {
          const response = await fetch("/api/payments/paypal/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber: session.orderNumber, lookupToken: session.lookupToken })
          });
          const body = await responseJson(response);
          return String(body.providerOrderId);
        },
        onApprove: async ({ orderID }) => {
          const response = await fetch("/api/payments/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber: session.orderNumber, lookupToken: session.lookupToken, providerOrderId: orderID })
          });
          await responseJson(response);
          window.location.assign(`/checkout/result?order=${encodeURIComponent(session.orderNumber)}&token=${encodeURIComponent(session.lookupToken)}`);
        },
        onError: (reason) => setError(reason instanceof Error ? reason.message : "PayPal checkout failed"),
        onCancel: () => setError("PayPal checkout was cancelled. You can try again.")
      });
      await buttons.render(container.current);
    }

    mount().catch((reason) => setError(reason instanceof Error ? reason.message : "PayPal checkout could not load"));
    return () => { disposed = true; buttons?.close?.(); };
  }, [clientId, session.lookupToken, session.orderNumber]);

  return <div className="hosted-payment"><div ref={container} />{error ? <p className="checkout-error" role="alert">{error}</p> : null}</div>;
}
