import { AnimatedShell } from "@/components/AnimatedShell";
import { CatalogClient } from "@/components/CatalogClient";
import { Footer } from "@/components/Footer";

export default function CatalogPage() {
  return (
    <AnimatedShell>
      <main>
        <section className="section">
          <div className="container">
            <CatalogClient />
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}
