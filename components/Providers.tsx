"use client";

import { CartProvider } from "@/components/CartProvider";
import type { StorefrontProduct } from "@/lib/catalog/model";

export function Providers({ children, products }: { children: React.ReactNode; products: StorefrontProduct[] }) {
  return <CartProvider products={products}>{children}</CartProvider>;
}
