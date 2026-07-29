"use client";

import { useEffect, useId, useState } from "react";
import type { CheckoutSession } from "./types";

type AirwallexElement = {
  mount: (selector: string) => void;
  on: (event: "success" | "error", callback: (value?: unknown) => void) => void;
  destroy?: () => void;
};

type AirwallexNamespace = {
  init: (options: { env: "demo" | "prod"; enabledElements: string[]; origin: string }) => Promise<void>;
  createElement: (type: "dropIn", options: { intent_id: string; client_secret: string; currency: "USD" }) => AirwallexElement;
};

declare global { interface Window { Airwallex?: AirwallexNamespace } }

async function responseJson(response: Response) {
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(body.error || "Airwallex request failed"));
  return body;
}

export function AirwallexCheckout({ session, environment }: { session: CheckoutSession; environment: "demo" | "production" }) {
  const id = `airwallex-${useId().replaceAll(":", "")}`;
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let element: AirwallexElement | undefined;
    async function mount() {
      const response = await fetch("/api/payments/airwallex/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: session.orderNumber, lookupToken: session.lookupToken })
      });
      const intent = await responseJson(response);
      let script = document.querySelector<HTMLScriptElement>("script[data-airwallex-sdk]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://checkout.airwallex.com/assets/elements.bundle.min.js";
        script.async = true;
        script.dataset.airwallexSdk = "true";
        document.head.appendChild(script);
      }
      if (!window.Airwallex) {
        await new Promise<void>((resolve, reject) => {
          script?.addEventListener("load", () => resolve(), { once: true });
          script?.addEventListener("error", () => reject(new Error("Airwallex checkout could not load")), { once: true });
        });
      }
      if (disposed || !window.Airwallex) return;
      await window.Airwallex.init({
        env: environment === "production" ? "prod" : "demo",
        enabledElements: ["payments"],
        origin: window.location.origin
      });
      element = window.Airwallex.createElement("dropIn", {
        intent_id: String(intent.paymentIntentId),
        client_secret: String(intent.clientSecret),
        currency: "USD"
      });
      element.mount(`#${id}`);
      element.on("success", () => {
        window.location.assign(`/checkout/result?order=${encodeURIComponent(session.orderNumber)}&token=${encodeURIComponent(session.lookupToken)}`);
      });
      element.on("error", (reason) => setError(reason instanceof Error ? reason.message : "Airwallex payment failed"));
    }
    mount().catch((reason) => setError(reason instanceof Error ? reason.message : "Airwallex checkout could not load"));
    return () => { disposed = true; element?.destroy?.(); };
  }, [environment, id, session.lookupToken, session.orderNumber]);

  return <div className="hosted-payment"><div id={id} className="airwallex-dropin" />{error ? <p className="checkout-error" role="alert">{error}</p> : null}</div>;
}
