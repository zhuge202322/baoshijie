import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(126,90,86,.28)", background: "#0b0b0b" }}>
      <div className="container footer-grid">
        <div>
          <div className="headline" style={{ fontSize: "1.8rem", color: "#8f8381", marginBottom: 18 }}>
            CarbonForge
          </div>
          <p className="muted" style={{ maxWidth: 420, lineHeight: 1.65 }}>
            Precision engineered carbon fiber, plastic composite, and metal components for the discerning classic Porsche enthusiast.
          </p>
        </div>
        <FooterColumn title="Explore" links={["Heritage", "Custom Works", "New Releases", "Shop All"]} />
        <FooterColumn title="Support" links={["Shipping", "Returns", "Fitment", "Legal"]} />
        <FooterColumn title="Connect" links={["Instagram", "YouTube", "LinkedIn", "Contact"]} />
      </div>
      <div className="container mono muted" style={{ borderTop: "1px solid rgba(126,90,86,.16)", padding: "22px 0", fontSize: 12 }}>
        2026 CarbonForge. Precision components for heritage performance builds.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h2 className="eyebrow" style={{ margin: "0 0 18px" }}>
        {title}
      </h2>
      <div style={{ display: "grid", gap: 12 }}>
        {links.map((link) => (
          <Link key={link} className="muted" href="/catalog">
            {link}
          </Link>
        ))}
      </div>
    </div>
  );
}
