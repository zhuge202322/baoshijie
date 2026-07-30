import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Headphones,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Truck
} from "lucide-react";
import { AnimatedShell } from "@/components/AnimatedShell";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ProductPurchasePanel } from "@/components/ProductPurchasePanel";
import { formatUsd } from "@/lib/catalog/model";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/catalog/storefront";
import { getDatabase } from "@/lib/db/client";

const inventoryCopy = {
  in_stock: { label: "In stock", detail: "Usually ships in 1-3 business days" },
  made_to_order: { label: "Made to order", detail: "Usually ships in 3-4 weeks" },
  unavailable: { label: "Unavailable", detail: "Contact us for the next production window" }
} as const;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const database = getDatabase();
  const product = getStorefrontProduct(database, slug);
  if (!product) notFound();

  const products = listStorefrontProducts(database).filter((item) => item.slug !== product.slug);
  const related = [
    ...products.filter((item) => item.category === product.category),
    ...products.filter((item) => item.category !== product.category)
  ].slice(0, 3);
  const inventory = inventoryCopy[product.inventoryStatus];

  return (
    <AnimatedShell>
      <main>
        <section className="product-detail-section">
          <div className="container">
            <nav className="product-breadcrumb mono" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight size={14} aria-hidden="true" />
              <Link href="/catalog">Products</Link>
              <ChevronRight size={14} aria-hidden="true" />
              <span aria-current="page">{product.name}</span>
            </nav>

            <div className="product-detail-layout">
              <div className="product-gallery reveal">
                <figure className="product-main-media">
                  {product.badge ? <figcaption>{product.badge}</figcaption> : null}
                  <img src={product.image} alt={product.name} />
                </figure>
                <div className="product-media-meta mono">
                  <span>{product.partNo}</span>
                  <span>{product.material}</span>
                </div>
              </div>

              <div className="product-buy-box reveal">
                <div className="product-type-row mono">
                  <span>{product.productType}</span>
                  <span>{product.category}</span>
                </div>
                <h1 className="headline">{product.name}</h1>
                <p className="product-part-number mono">Part no. {product.partNo}</p>
                <p className="product-detail-price">{formatUsd(product.priceCents)}</p>
                <p className="product-short-description">{product.short}</p>

                <div className={`product-inventory product-inventory-${product.inventoryStatus}`}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{inventory.label}</strong>
                    <small>{inventory.detail}</small>
                  </div>
                </div>

                <div className="product-fitment-summary">
                  <p className="product-control-label">Compatible with</p>
                  <div>
                    {product.compatibility.map((model) => <span key={model}>{model}</span>)}
                  </div>
                </div>

                <ProductPurchasePanel
                  slug={product.slug}
                  name={product.name}
                  inventoryStatus={product.inventoryStatus}
                />

                <div className="product-buy-assurance">
                  <span><Truck size={18} aria-hidden="true" />Tracked international delivery</span>
                  <span><LockKeyhole size={18} aria-hidden="true" />Secure hosted payment</span>
                </div>
                <p className="product-fitment-help">
                  Unsure about fitment? <Link href="/#contact-us">Contact us before ordering.</Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="product-information-band">
          <div className="container product-information-grid">
            <article className="product-description-block reveal">
              <p className="eyebrow">Product information</p>
              <h2 className="headline">Details and fitment</h2>
              <p>{product.description}</p>
              <dl className="product-facts">
                <div><dt>Material</dt><dd>{product.material}</dd></div>
                <div><dt>Category</dt><dd>{product.category}</dd></div>
                <div><dt>Product type</dt><dd>{product.productType}</dd></div>
              </dl>
              <div className="product-compatibility-list">
                <h3 className="headline">Vehicle compatibility</h3>
                <ul>
                  {product.compatibility.map((model) => (
                    <li key={model}><PackageCheck size={18} aria-hidden="true" />{model}</li>
                  ))}
                </ul>
              </div>
            </article>

            <section className="product-specifications reveal" aria-labelledby="product-specifications-heading">
              <p className="eyebrow">Build data</p>
              <h2 className="headline" id="product-specifications-heading">Technical specifications</h2>
              <table className="spec-table">
                <tbody>
                  {Object.entries(product.specs).map(([label, value]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </section>

        <section className="product-service-band" aria-label="Purchase support">
          <div className="container product-service-grid">
            <Service icon={<ShieldCheck size={22} aria-hidden="true" />} title="Fitment checked" text="Order details are reviewed against your exact Porsche model." />
            <Service icon={<Truck size={22} aria-hidden="true" />} title="Tracked shipping" text="DHL, FedEx, UPS, and alternative freight options are available." />
            <Service icon={<Headphones size={22} aria-hidden="true" />} title="Direct support" text="Our team contacts you directly when an order needs confirmation." />
          </div>
        </section>

        <section className="section product-recommendations">
          <div className="container">
            <div className="product-section-heading reveal">
              <div>
                <p className="eyebrow">Selected for your build</p>
                <h2 className="headline">You may also like</h2>
              </div>
              <Link className="mono" href="/catalog">View all products <ChevronRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className="catalog-grid">
              {related.map((item) => <ProductCard key={item.slug} product={item} />)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </AnimatedShell>
  );
}

function Service({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="product-service-item">
      <span>{icon}</span>
      <div><strong>{title}</strong><p>{text}</p></div>
    </div>
  );
}
