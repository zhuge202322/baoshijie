import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/SiteNav";
import { getStorefrontContent, listStorefrontProducts } from "@/lib/catalog/storefront";
import { getDatabase } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bespoke Elemental | Classic Porsche 911 Components",
  description:
    "Bespoke Elemental: Refine the Soul of the 911. Premium restoration, tuning, and OE aftermarket parts for classic Porsche models."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const database = getDatabase();
  const { settings, socialLinks } = getStorefrontContent(database);
  const products = listStorefrontProducts(database);

  return (
    <html lang="en">
      <body>
        <Providers products={products}>
          <div className="site-shell">
            <SiteNav
              websiteName={settings.websiteName}
              logoUrl={settings.logoUrl}
              socialLinks={socialLinks.map(({ id, label, url }) => ({ id, label, url }))}
            />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
