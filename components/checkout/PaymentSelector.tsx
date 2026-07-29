import { CreditCard, WalletCards } from "lucide-react";
import type { PaymentConfig } from "./types";

export function PaymentSelector({
  config,
  value,
  onChange,
  disabled
}: {
  config: PaymentConfig;
  value: "paypal" | "airwallex" | "";
  onChange: (value: "paypal" | "airwallex") => void;
  disabled: boolean;
}) {
  return (
    <fieldset className="checkout-payment-options">
      <legend className="sr-only">Payment method</legend>
      <label className={config.paypal.available ? "" : "is-disabled"}>
        <input
          type="radio"
          name="paymentProvider"
          value="paypal"
          checked={value === "paypal"}
          onChange={() => onChange("paypal")}
          disabled={disabled || !config.paypal.available}
          aria-label="PayPal"
        />
        <WalletCards size={20} aria-hidden="true" />
        <span><strong>PayPal</strong><small>{config.paypal.available ? "Pay securely with PayPal" : "Not configured"}</small></span>
      </label>
      <label className={config.airwallex.available ? "" : "is-disabled"}>
        <input
          type="radio"
          name="paymentProvider"
          value="airwallex"
          checked={value === "airwallex"}
          onChange={() => onChange("airwallex")}
          disabled={disabled || !config.airwallex.available}
          aria-label="Credit or debit card via Airwallex"
        />
        <CreditCard size={20} aria-hidden="true" />
        <span><strong>Credit or debit card</strong><small>{config.airwallex.available ? "Hosted securely by Airwallex" : "Not configured"}</small></span>
      </label>
    </fieldset>
  );
}
