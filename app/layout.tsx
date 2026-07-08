import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "CarbonForge | Bespoke Porsche Heritage Components",
  description:
    "A high-end B2C storefront for classic Porsche carbon fiber, machined metal, and bespoke performance components."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="site-shell">
            <SiteNav />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
