import { AnimatedShell } from "@/components/AnimatedShell";
import { CheckoutClient } from "@/components/CheckoutClient";
import { getPublicPaymentConfig } from "@/lib/payments/config";
import { getDatabase } from "@/lib/db/client";
import { getShippingRates } from "@/lib/checkout/shipping";

export default function CheckoutPage() {
  const paymentConfig = getPublicPaymentConfig();
  const shippingRates = getShippingRates(getDatabase());
  return (
    <AnimatedShell>
      <main>
        <CheckoutClient paymentConfig={paymentConfig} shippingRates={shippingRates} />
      </main>
    </AnimatedShell>
  );
}
