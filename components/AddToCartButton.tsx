"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export function AddToCartButton({ slug, label = "Add to Cart" }: { slug: string; label?: string }) {
  const { addItem } = useCart();

  return (
    <button className="button primary mono" type="button" onClick={() => addItem(slug)}>
      <ShoppingCart size={18} aria-hidden="true" />
      {label}
    </button>
  );
}
