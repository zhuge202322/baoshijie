"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { StorefrontProduct } from "@/lib/catalog/model";

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  items: Array<{ product: StorefrontProduct; quantity: number }>;
  count: number;
  subtotalCents: number;
  addItem: (slug: string) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
};

const storageKey = "carbonforge-cart";

const defaultLines: CartLine[] = [];

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, products }: { children: React.ReactNode; products: StorefrontProduct[] }) {
  const [lines, setLines] = useState<CartLine[]>(defaultLines);
  const [hydrated, setHydrated] = useState(false);
  const productMap = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartLine[];
        setLines(parsed.filter((line) => productMap.has(line.slug) && line.quantity > 0 && line.quantity <= 9));
      } catch {
        setLines(defaultLines);
      }
    }
    setHydrated(true);
  }, [productMap]);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    }
  }, [hydrated, lines]);

  const items = useMemo(
    () =>
      lines
        .map((line) => {
          const product = productMap.get(line.slug);
          return product ? { product, quantity: line.quantity } : null;
        })
        .filter(Boolean) as Array<{ product: StorefrontProduct; quantity: number }>,
    [lines, productMap]
  );

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalCents = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

    return {
      lines,
      items,
      count,
      subtotalCents,
      addItem: (slug) => {
        setLines((current) => {
          const existing = current.find((line) => line.slug === slug);
          if (existing) {
            return current.map((line) =>
              line.slug === slug ? { ...line, quantity: Math.min(9, line.quantity + 1) } : line
            );
          }
          return [...current, { slug, quantity: 1 }];
        });
      },
      removeItem: (slug) => {
        setLines((current) => current.filter((line) => line.slug !== slug));
      },
      setQuantity: (slug, quantity) => {
        setLines((current) =>
          current
            .map((line) =>
              line.slug === slug ? { ...line, quantity: Math.max(0, Math.min(quantity, 9)) } : line
            )
            .filter((line) => line.quantity > 0)
        );
      },
      clear: () => setLines([])
    };
  }, [items, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
