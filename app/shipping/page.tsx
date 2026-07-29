import Link from "next/link";
import { ArrowRight, Clock3, PackageCheck, Truck } from "lucide-react";
import { AnimatedShell } from "@/components/AnimatedShell";
import { Footer } from "@/components/Footer";
import { getMediaMap } from "@/lib/catalog/storefront";
import { getDatabase } from "@/lib/db/client";

const details = [
  {
    icon: <PackageCheck size={22} aria-hidden="true" />,
    title: "In-stock orders",
    text: "In-stock products normally ship within one to three business days after we receive your order."
  },
  {
    icon: <Clock3 size={22} aria-hidden="true" />,
    title: "Made-to-order parts",
    text: "Dispatch timing for non-stock items follows the factory production schedule. Most orders are ready to ship in three to four weeks."
  },
  {
    icon: <Truck size={22} aria-hidden="true" />,
    title: "Delivery partners",
    text: "We primarily ship with DHL, FedEx, and UPS. If you need a lower-cost shipping option, contact us before ordering; we can also arrange more economical alternative carriers."
  }
];

export default function ShippingPage() {
  const hero = getMediaMap(getDatabase())["shipping.hero"];
  return (
    <AnimatedShell>
      <main>
        <section className="shipping-hero section" style={{ backgroundImage: `linear-gradient(180deg, rgba(5, 5, 5, 0.2), rgba(5, 5, 5, 0.9)), url('${hero?.imageUrl || "/images/bespoke-elemental/about-06.png"}')` }}>
          <div className="container reveal">
            <p className="eyebrow">Support</p>
            <h1 className="display">Shipping</h1>
            <p className="muted">
              Clear lead times, tracked delivery, and careful fitment confirmation for every classic Porsche component.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container shipping-grid">
            {details.map((item) => (
              <article className="panel panel-pad reveal" key={item.title}>
                <span className="icon-button shipping-icon">{item.icon}</span>
                <h2 className="headline">{item.title}</h2>
                <p className="muted">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section shipping-fitment">
          <div className="container reveal">
            <p className="eyebrow">Before placing an order</p>
            <h2 className="display">Confirm the exact fitment.</h2>
            <p className="muted">
              Product compatibility depends closely on the exact model and configuration. If any fitment detail is unclear, please contact us before placing your order.
            </p>
            <Link className="button primary mono" href="/#contact-us">
              Contact Us
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}
