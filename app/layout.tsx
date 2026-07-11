import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Bespoke Elemental | Classic Porsche 911 Components",
  description:
    "Bespoke Elemental: Refine the Soul of the 911. Premium restoration, tuning, and OE aftermarket parts for classic Porsche models."
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
