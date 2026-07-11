import Link from "next/link";
import { ArrowRight, Crosshair, Hammer, Layers3, Ruler } from "lucide-react";
import { AnimatedShell } from "@/components/AnimatedShell";
import { Footer } from "@/components/Footer";

const principles = [
  {
    icon: <Ruler size={22} aria-hidden="true" />,
    title: "Blueprint fitment",
    text: "Every part starts with chassis scans, tolerance maps, and reversible mounting constraints."
  },
  {
    icon: <Layers3 size={22} aria-hidden="true" />,
    title: "Composite intelligence",
    text: "Carbon fiber, polymer, and metal are selected by load, heat, touch, and visual honesty."
  },
  {
    icon: <Hammer size={22} aria-hidden="true" />,
    title: "Hand-finished runs",
    text: "Small serialized batches keep each component traceable, inspectable, and collectible."
  },
  {
    icon: <Crosshair size={22} aria-hidden="true" />,
    title: "Driver focus",
    text: "The cockpit stays quiet, tactile, and purposeful instead of becoming a generic modern shell."
  }
];

export default function HeritagePage() {
  return (
    <AnimatedShell>
      <main>
        <section
          className="hero-section"
          style={{
            minHeight: "72dvh",
            backgroundImage:
              "linear-gradient(180deg, rgba(5,5,5,.2), rgba(5,5,5,.9)), url('/images/bespoke-elemental/heritage-hero-hd.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center 42%"
          }}
        >
          <div className="carbon-weave" />
          <div className="hero-copy" style={{ textAlign: "center" }}>
            <p className="eyebrow">Manifesto</p>
            <h1 className="display" style={{ marginInline: "auto" }}>
              Modern Tech, <span className="red">Classic Soul</span>
            </h1>
            <p style={{ marginInline: "auto" }}>
              Advanced and refined production for owners who want progress without erasing the
              analogue character of a vintage Porsche.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container grid-12">
            <div className="reveal" style={{ gridColumn: "span 5" }}>
              <p className="eyebrow" style={{ color: "#d5001c" }}>
                The Pursuit
              </p>
              <h2 className="display" style={{ margin: "12px 0 22px", fontSize: "clamp(2.4rem, 6vw, 5rem)" }}>
                Honor the chassis. Upgrade the contact points.
              </h2>
            </div>
            <div className="reveal" style={{ gridColumn: "span 7" }}>
              <p className="muted" style={{ lineHeight: 1.78, fontSize: "1.08rem" }}>
                We're actively providing exquisite parts for classic Porsche 911 both interior and
                outside of the cars. Customed parts for restorations, upgradings, and OE aftermarket
                substitutes are mianly within our focus.
              </p>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: "rgba(0,0,0,.22)" }}>
          <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {principles.map((item) => (
              <article className="panel panel-pad reveal" key={item.title}>
                <span className="icon-button" style={{ color: "#ffb3ac", borderColor: "rgba(255,179,172,.32)" }}>
                  {item.icon}
                </span>
                <h2 className="headline" style={{ margin: "22px 0 12px", fontSize: "1.25rem" }}>
                  {item.title}
                </h2>
                <p className="muted" style={{ margin: 0, lineHeight: 1.65 }}>
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="container reveal" style={{ textAlign: "center" }}>
            <h2 className="display" style={{ margin: "0 auto 22px", maxWidth: 900, fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
              Bring the atelier into your build.
            </h2>
            <Link className="button primary mono" href="/catalog">
              Explore Components
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}
