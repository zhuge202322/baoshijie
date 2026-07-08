"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product, getProduct } from "@/data/products";

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  items: Array<{ product: Product; quantity: number }>;
  count: number;
  subtotal: number;
  addItem: (slug: string) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
};

const storageKey = "carbonforge-cart";

const defaultLines: CartLine[] = [
  { slug: "rs-64-air-intake", quantity: 1 },
  { slug: "precision-short-shifter", quantity: 1 }
];

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(defaultLines);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartLine[];
        setLines(parsed.filter((line) => getProduct(line.slug) && line.quantity > 0));
      } catch {
        setLines(defaultLines);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    }
  }, [hydrated, lines]);

  const items = useMemo(
    () =>
      lines
        .map((line) => {
          const product = getProduct(line.slug);
          return product ? { product, quantity: line.quantity } : null;
        })
        .filter(Boolean) as Array<{ product: Product; quantity: number }>,
    [lines]
  );

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
      lines,
      items,
      count,
      subtotal,
      addItem: (slug) => {
        setLines((current) => {
          const existing = current.find((line) => line.slug === slug);
          if (existing) {
            return current.map((line) =>
              line.slug === slug ? { ...line, quantity: line.quantity + 1 } : line
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
