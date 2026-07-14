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

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="nav-bar">
      <nav className="nav-inner" aria-label="Primary navigation">
        <Link className="logo-lockup" href="/" aria-label="Bespoke Elemental home">
          <img src="/brand/flame-logo.png" alt="" width={545} height={832} aria-hidden="true" />
          <span className="logo-wordmark">
            <span className="logo-initial">B</span>espoke{" "}
            <span className="logo-initial">E</span>lemental
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
            {socialOpen && (
              <div className="social-menu" role="menu">
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" role="menuitem">
                  Instagram
                </a>
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" role="menuitem">
                  Facebook
                </a>
              </div>
            )}
          </div>

          <Link className="icon-button" href="/cart" aria-label={`Cart with ${count} items`} title="Cart">
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
