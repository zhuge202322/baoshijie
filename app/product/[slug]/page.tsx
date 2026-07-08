import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ruler, ShieldCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { AnimatedShell } from "@/components/AnimatedShell";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { formatCurrency, getProduct, products } from "@/data/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = products.filter((item) => item.slug !== product.slug).slice(0, 3);

  return (
    <AnimatedShell>
      <main>
        <section
          className="hero-section"
          style={{
            minHeight: "calc(100dvh - 80px)",
            background:
              "linear-gradient(90deg, rgba(5,5,5,.9) 0%, rgba(5,5,5,.58) 45%, rgba(5,5,5,.9) 100%)"
          }}
        >
          <div style={{ position: "absolute", inset: 0, zIndex: -1 }}>
            <img
              src={product.image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5, filter: "saturate(.85)" }}
            />
          </div>
          <div className="carbon-weave" />
          <div className="hero-copy">
            <Link className="button ghost mono" href="/catalog" style={{ marginBottom: 24 }}>
              <ArrowLeft size={17} aria-hidden="true" />
              Back to Catalog
            </Link>
            {product.badge && (
              <p className="eyebrow" style={{ width: "fit-content", padding: "7px 10px", background: "#d5001c", color: "#fff" }}>
                {product.badge}
              </p>
            )}
            <h1 className="display">{product.name}</h1>
            <p>{product.description}</p>
            <div className="hero-actions">
              <AddToCartButton slug={product.slug} label={`Add ${formatCurrency(product.price)}`} />
              <Link className="button ghost mono" href="/checkout">
                Reserve Build Slot
              </Link>
            </div>
            <p className="mono muted" style={{ marginTop: 28, fontSize: 13 }}>
              Est. delivery: 4-6 weeks / SKU: {product.partNo}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container grid-12">
            <div className="panel panel-pad reveal" style={{ gridColumn: "span 5" }}>
              <h2 className="headline" style={{ marginTop: 0 }}>
                Technical Specs
              </h2>
              <table className="spec-table">
                <tbody>
                  {Object.entries(product.specs).map(([label, value]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Compatibility</td>
                    <td>{product.compatibility.join(", ")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="reveal" style={{ gridColumn: "span 7" }}>
              <div style={{ display: "grid", gap: 18 }}>
                <Feature icon={<Ruler size={20} aria-hidden="true" />} title="Measured fitment" text="Designed around factory mounting points and scanned chassis tolerances." />
                <Feature icon={<ShieldCheck size={20} aria-hidden="true" />} title="Serialized inspection" text="Each component is inspected and logged before shipment." />
                <Feature icon={<Truck size={20} aria-hidden="true" />} title="Insured delivery" text="High-value parts ship in reinforced packaging with tracked delivery." />
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "rgba(0,0,0,.22)" }}>
          <div className="container">
            <h2 className="display reveal" style={{ margin: "0 0 32px", fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>
              Recommended Components
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              {related.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="panel panel-pad">
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 16, alignItems: "start" }}>
        <span className="icon-button" style={{ color: "#ffb3ac", borderColor: "rgba(255,179,172,.28)" }}>
          {icon}
        </span>
        <div>
          <h3 className="headline" style={{ margin: "0 0 8px", fontSize: "1.15rem" }}>
            {title}
          </h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.62 }}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
