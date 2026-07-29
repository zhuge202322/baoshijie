import { AnimatedShell } from "@/components/AnimatedShell";
import { CheckoutClient } from "@/components/CheckoutClient";
import { getPublicPaymentConfig } from "@/lib/payments/config";

export default function CheckoutPage() {
  const paymentConfig = getPublicPaymentConfig();
  return (
    <AnimatedShell>
      <main>
        <CheckoutClient paymentConfig={paymentConfig} />
      </main>
    </AnimatedShell>
  );
}
