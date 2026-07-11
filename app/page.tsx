import Link from "next/link";
import { ArrowRight, ChevronDown, Gauge, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { AnimatedShell } from "@/components/AnimatedShell";
import { BuildConfigurator } from "@/components/BuildConfigurator";
import { Footer } from "@/components/Footer";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";
import { featuredProduct, formatCurrency, products } from "@/data/products";

export default function HomePage() {
  const preview = products.slice(0, 6);

  return (
    <AnimatedShell>
      <main>
        <section className="hero-section carousel-hero" aria-label="Classic Porsche showcase">
          <HeroCarousel />
          <a className="hero-scroll-cue" href="#featured-modification" aria-label="Scroll to next section">
            <ChevronDown size={30} aria-hidden="true" />
          </a>
        </section>

        <section className="section" id="featured-modification">
          <div className="container grid-12">
            <div className="reveal" style={{ gridColumn: "span 5" }}>
              <p className="eyebrow" style={{ color: "#d5001c" }}>
                Featured Modification
              </p>
              <h2 className="display" style={{ margin: "14px 0 22px", fontSize: "clamp(2.6rem, 6vw, 5.7rem)" }}>
                Driver Interface, Rebuilt
              </h2>
              <p className="muted" style={{ lineHeight: 1.72, maxWidth: 560 }}>
                The Heritage Steering Wheel is engineered as the first point of contact between a
                classic chassis and a modern driver. Satin carbon, perforated leather, and a
                machined hub meet in a serialized build.
              </p>
              <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
                <AddToCartButton slug={featuredProduct.slug} label={`Pre-Order ${formatCurrency(featuredProduct.price)}`} />
                <Link className="button ghost mono" href={`/product/${featuredProduct.slug}`}>
                  Technical Specs
                </Link>
              </div>
            </div>

            <div className="panel reveal" style={{ gridColumn: "span 7", overflow: "hidden" }}>
              <div className="product-image" style={{ aspectRatio: "16 / 9" }}>
                <img src={featuredProduct.image} alt={featuredProduct.name} />
              </div>
              <div className="panel-pad">
                <table className="spec-table" aria-label="Featured product specifications">
                  <tbody>
                    {Object.entries(featuredProduct.specs).map(([label, value]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "rgba(0,0,0,.22)" }}>
          <div className="container grid-12">
            <div className="reveal" style={{ gridColumn: "span 6" }}>
              <div className="panel" style={{ overflow: "hidden" }}>
                <img
                  src="/images/carbonforge-hero.jpg"
                  alt="Carbon fiber body panel in the Bespoke Elemental workshop"
                  style={{ width: "100%", height: "min(64vw, 640px)", objectFit: "cover" }}
                />
              </div>
            </div>
            <div className="reveal" style={{ gridColumn: "span 6", alignSelf: "center" }}>
              <p className="eyebrow" style={{ color: "#d5001c" }}>
                Heritage Engineering
              </p>
              <h2 className="display" style={{ margin: "14px 0 24px", fontSize: "clamp(2.5rem, 6vw, 5.4rem)" }}>
                Modern Tech, Classic Soul
              </h2>
              <p className="muted" style={{ lineHeight: 1.72 }}>
                Every component is treated like a restoration decision. We preserve the analog
                character of air-cooled Porsche interiors while upgrading the material science,
                durability, and tactile precision.
              </p>
              <div style={{ display: "grid", gap: 18, marginTop: 34 }}>
                <Principle icon={<Gauge size={20} aria-hidden="true" />} title="Mechanical feel" text="Controls are weighted, machined, and finished around real driver feedback." />
                <Principle icon={<ShieldCheck size={20} aria-hidden="true" />} title="Reversible fitment" text="Original mounting logic is respected for valuable heritage chassis." />
                <Principle icon={<Sparkles size={20} aria-hidden="true" />} title="Material-led luxury" text="Carbon weave, brushed metal, leather, and composites drive the visual system." />
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="latest-release">
          <div className="container">
            <div
              className="reveal"
              style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 32 }}
            >
              <div>
                <p className="eyebrow" style={{ color: "#d5001c" }}>
                  Premium Inventory
                </p>
                <h2 className="display" style={{ margin: "10px 0 0", fontSize: "clamp(2.6rem, 6vw, 5.8rem)" }}>
                  The Catalog
                </h2>
              </div>
              <Link className="button ghost mono" href="/catalog">
                View All
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 24
              }}
            >
              {preview.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        <BuildConfigurator />

        <section className="section" style={{ borderTop: "1px solid rgba(126,90,86,.28)" }}>
          <div className="container reveal" style={{ textAlign: "center" }}>
            <Wrench size={28} color="#ffb3ac" aria-hidden="true" />
            <h2 className="display" style={{ margin: "18px auto 22px", maxWidth: 980, fontSize: "clamp(2.6rem, 6vw, 5.5rem)" }}>
              Ready to Refine Your Drive?
            </h2>
            <p className="muted" style={{ maxWidth: 680, margin: "0 auto 30px", lineHeight: 1.7 }}>
              Our workshop is accepting full interior conversions, limited component runs, and
              special material commissions for air-cooled platforms.
            </p>
            <Link className="button primary mono" href="/checkout">
              Start Acquisition
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}

function Principle({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, alignItems: "start" }}>
      <span className="icon-button" style={{ color: "#ffb3ac", borderColor: "rgba(255,179,172,.28)" }}>
        {icon}
      </span>
      <span>
        <strong className="headline" style={{ display: "block", fontSize: "1rem" }}>
          {title}
        </strong>
        <span className="muted" style={{ display: "block", marginTop: 6, lineHeight: 1.55 }}>
          {text}
        </span>
      </span>
    </div>
  );
}
