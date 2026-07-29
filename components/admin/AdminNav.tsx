"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FolderTree,
  Gauge,
  ImageIcon,
  Link2,
  Settings,
  ShoppingBag
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/media", label: "Page images", icon: ImageIcon },
  { href: "/admin/social", label: "Social links", icon: Link2 },
  { href: "/admin/settings", label: "Site settings", icon: Settings }
];

export function AdminNav({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin">
        <span className="admin-brand-mark">BE</span>
        <span>Bespoke Elemental<small>Administration</small></span>
      </Link>
      <nav className="admin-nav" aria-label="Administration">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="admin-account">
        <span className="admin-account-label">Signed in as</span>
        <strong>{username}</strong>
        <LogoutButton />
      </div>
    </aside>
  );
}
