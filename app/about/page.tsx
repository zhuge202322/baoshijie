import { AnimatedShell } from "@/components/AnimatedShell";
import { Footer } from "@/components/Footer";

const sections = [
  {
    title: "Born in GT Racing",
    text: "Born from the grueling demands of GT racing carbon fiber maintenance and development, our expertise is now available to elevate your driving experience. We don't just supply parts; we craft the components that keep automotive legends alive."
  },
  {
    title: "Crafting Perfection for the Air-Cooled Legend.",
    text: "At Bespoke Elemental, we bridge the gap between classic heritage and modern engineering. Specializing in high-performance carbon fiber components for the Porsche 911, we treat every piece as a functional sculpture. Each part is meticulously engineered to honor the soul of your machine, ensuring that performance and aesthetics live in perfect harmony. We don’t just create replacements; we curate the elemental essence of your 911."
  },
  {
    title: "Bespoke and OE Expertise",
    text: "Bespoke Elemental specializes in both bespoke upgrades and essential OE replacements. Our custom portfolio spans exterior and interior enhancements, meticulously crafted from carbon fiber, metal, and high-grade polymers. For those seeking factory-perfect reliability, we also supply comprehensive OE-spec replacements, with a focus on precision metal and plastic components."
  }
];

const images = Array.from({ length: 6 }, (_, index) => ({
  src: `/images/bespoke-elemental/about-0${index + 1}.png`,
  alt: [
    "Carbon fiber components and composite materials in the Bespoke Elemental workshop",
    "Carbon fiber process excellence in an autoclave workshop",
    "Carbon fiber component designed in precision CAD software",
    "Composite production tools, molds, and racing parts",
    "Carbon fiber interior components and workshop materials",
    "Advanced carbon fiber production equipment and raw material"
  ][index]
}));

export default function AboutPage() {
  return (
    <AnimatedShell>
      <main>
        <section className="about-intro section">
          <div className="container">
            <p className="eyebrow reveal">About Us</p>
            <h1 className="display reveal">Engineering the Elemental</h1>
          </div>
        </section>

        <section className="about-story container">
          {sections.map((section, index) => (
            <article className="about-story-row reveal" key={section.title}>
              <p className="mono about-index">0{index + 1}</p>
              <div>
                <h2 className="headline">{section.title}</h2>
                <p className="muted">{section.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="section">
          <div className="container about-gallery">
            {images.map((item) => (
              <figure className="reveal" key={item.src}>
                <img src={item.src} alt={item.alt} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}
