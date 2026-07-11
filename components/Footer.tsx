import Link from "next/link";

export function Footer() {
  return (
    <footer id="contact-us" style={{ borderTop: "1px solid rgba(126,90,86,.28)", background: "#0b0b0b" }}>
      <div className="container footer-grid">
        <div>
          <div className="headline" style={{ fontSize: "1.8rem", color: "#8f8381", marginBottom: 18 }}>
            Bespoke Elemental
          </div>
          <p className="footer-slogan">Refine the Soul of the 911.</p>
          <p className="muted" style={{ maxWidth: 420, lineHeight: 1.65 }}>
            Precision engineered carbon fiber, plastic composite, and metal components for the discerning classic Porsche enthusiast.
          </p>
        </div>
        <FooterColumn
          title="Explore"
          links={[
            { label: "About Us", href: "/about" },
            { label: "Heritage", href: "/heritage" },
            { label: "Latest Release", href: "/#latest-release" },
            { label: "Shop All", href: "/catalog" }
          ]}
        />
        <FooterColumn
          title="Support"
          links={[
            { label: "Shipping", href: "/shipping" },
            { label: "Returns", href: "/shipping" }
          ]}
        />
        <FooterColumn
          title="Payment Method"
          links={[
            { label: "Credit card (VISA, Mastercard)", href: "/checkout" },
            { label: "PayPal", href: "/checkout" },
            { label: "Wire transfer", href: "/checkout" }
          ]}
        />
        <FooterColumn
          title="Connect"
          links={[
            { label: "Instagram", href: "https://www.instagram.com/" },
            { label: "Facebook", href: "https://www.facebook.com/" },
            { label: "Contact Us", href: "/#contact-us" }
          ]}
        />
      </div>
      <div className="container mono muted" style={{ borderTop: "1px solid rgba(126,90,86,.16)", padding: "22px 0", fontSize: 12 }}>
        2026 Bespoke Elemental. Precision components for heritage performance builds.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow" style={{ margin: "0 0 18px" }}>
        {title}
      </h2>
      <div style={{ display: "grid", gap: 12 }}>
        {links.map((link) => (
          <Link key={link.label} className="muted" href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
