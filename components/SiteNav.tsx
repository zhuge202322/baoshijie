"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, UserCircle, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

const links = [
  { href: "/catalog", label: "Shop" },
  { href: "/heritage", label: "Heritage" },
  { href: "/#custom-works", label: "Custom Works" }
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="nav-bar">
      <nav className="nav-inner" aria-label="Primary navigation">
        <Link className="logo-lockup" href="/" aria-label="CarbonForge home">
          <Image src="/brand/flame-logo.png" alt="" width={545} height={832} priority />
          <span>CarbonForge</span>
        </Link>

        <div className="nav-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="search-box" aria-label="Search catalog">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Search catalog" />
          </label>

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

          <button className="icon-button" type="button" aria-label="Account" title="Account">
            <UserCircle size={22} aria-hidden="true" />
          </button>

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
          {links.map((link) => (
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
