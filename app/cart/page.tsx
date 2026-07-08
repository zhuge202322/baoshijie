import { AnimatedShell } from "@/components/AnimatedShell";
import { CartClient } from "@/components/CartClient";
import { Footer } from "@/components/Footer";

export default function CartPage() {
  return (
    <AnimatedShell>
      <main>
        <CartClient />
      </main>
      <Footer />
    </AnimatedShell>
  );
}
