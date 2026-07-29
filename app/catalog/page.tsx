import { AnimatedShell } from "@/components/AnimatedShell";
import { CatalogClient } from "@/components/CatalogClient";
import { Footer } from "@/components/Footer";
import { listStorefrontProducts } from "@/lib/catalog/storefront";
import { getDatabase } from "@/lib/db/client";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const products = listStorefrontProducts(getDatabase());

  return (
    <AnimatedShell>
      <main>
        <section className="section">
          <div className="container">
            <CatalogClient featured={products} initialType={type === "oe" ? "OE aftermarket" : type === "bespoke" ? "Bespoke" : undefined} />
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}
