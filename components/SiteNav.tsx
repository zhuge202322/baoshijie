"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe2, Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

const links = [
  { href: "/about", label: "About Us" },
  { href: "/heritage", label: "Heritage" },
  { href: "/#latest-release", label: "Latest Release" },
  { href: "/catalog", label: "Shop" },
  { href: "/#contact-us", label: "Contact Us" }
];

export function SiteNav({
  websiteName,
  logoUrl,
  socialLinks
}: {
  websiteName: string;
  logoUrl: string;
  socialLinks: Array<{ id: string; label: string; url: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const { count } = useCart();

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="nav-bar">
      <nav className="nav-inner" aria-label="Primary navigation">
        <Link className="logo-lockup" href="/" aria-label={`${websiteName} home`}>
          <img src={logoUrl} alt="" width={545} height={832} aria-hidden="true" />
          <span className="logo-wordmark">
            {websiteName.split(/\s+/).map((word, index) => (
              <span key={`${word}-${index}`}><span className="logo-initial">{word[0]}</span>{word.slice(1)}{index < websiteName.split(/\s+/).length - 1 ? " " : ""}</span>
            ))}
          </span>
        </Link>

        <div className="nav-links">
          {links.slice(0, 3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <div
            className="nav-dropdown"
            data-open={productOpen}
            onMouseEnter={() => setProductOpen(true)}
            onMouseLeave={() => setProductOpen(false)}
          >
            <button
              type="button"
              aria-expanded={productOpen}
              aria-haspopup="menu"
              onFocus={() => setProductOpen(true)}
              onClick={() => setProductOpen((value) => !value)}
            >
              Product
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <div className="nav-dropdown-menu" role="menu">
              <Link href="/catalog?type=bespoke" role="menuitem" onClick={() => setProductOpen(false)}>
                Bespoke products
              </Link>
              <Link href="/catalog?type=oe" role="menuitem" onClick={() => setProductOpen(false)}>
                OE aftermarket products
              </Link>
            </div>
          </div>
          {links.slice(3).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <div className="social-dropdown">
            <button
              className="icon-button"
              type="button"
              aria-label="Social media"
              aria-expanded={socialOpen}
              aria-haspopup="menu"
              title="Social media"
              onClick={() => setSocialOpen((value) => !value)}
            >
              <Globe2 size={22} aria-hidden="true" />
            </button>
            {socialOpen && socialLinks.length > 0 && (
              <div className="social-menu" role="menu">
                {socialLinks.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" role="menuitem">{link.label}</a>)}
              </div>
            )}
          </div>

          <Link className="icon-button" href="/cart" aria-label={`Cart with ${count} ${count === 1 ? "item" : "items"}`} title="Cart">
            <span style={{ position: "relative", display: "inline-flex" }}>
              <ShoppingCart size={22} aria-hidden="true" />
              {count > 0 && (
                <span className="cart-badge" style={{ position: "absolute", right: -12, top: -12 }}>
                  {count}
                </span>
              )}
            </span>
          </Link>

          <button
            className="icon-button mobile-menu"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="nav-panel">
          {links.slice(0, 3).map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <span className="nav-panel-label">Product</span>
          <Link href="/catalog?type=bespoke" onClick={() => setOpen(false)}>
            Bespoke products
          </Link>
          <Link href="/catalog?type=oe" onClick={() => setOpen(false)}>
            OE aftermarket products
          </Link>
          {links.slice(3).map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setOpen(false)}>
            Cart
          </Link>
        </div>
      )}
    </header>
  );
}
