import { AnimatedShell } from "@/components/AnimatedShell";
import { CatalogClient } from "@/components/CatalogClient";
import { Footer } from "@/components/Footer";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;

  return (
    <AnimatedShell>
      <main>
        <section className="section">
          <div className="container">
            <CatalogClient initialType={type === "oe" ? "OE aftermarket" : type === "bespoke" ? "Bespoke" : undefined} />
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}
