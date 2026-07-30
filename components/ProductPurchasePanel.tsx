"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export function ProductPurchasePanel({
  slug,
  name,
  inventoryStatus
}: {
  slug: string;
  name: string;
  inventoryStatus: "in_stock" | "made_to_order" | "unavailable";
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const unavailable = inventoryStatus === "unavailable";

  function addSelection() {
    if (unavailable) return;
    addItem(slug, quantity);
    setAdded(true);
  }

  function buyNow() {
    if (unavailable) return;
    addItem(slug, quantity);
    router.push("/checkout");
  }

  if (unavailable) {
    return (
      <div className="product-purchase-unavailable">
        <p>This component is currently unavailable.</p>
        <Link className="button primary mono" href="/#contact-us">Contact us about {name}</Link>
      </div>
    );
  }

  return (
    <div className="product-purchase">
      <div className="product-quantity-row">
        <span className="product-control-label">Quantity</span>
        <div className="quantity-stepper" aria-label="Quantity selector">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity === 1}
            onClick={() => { setQuantity((value) => Math.max(1, value - 1)); setAdded(false); }}
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label="Selected quantity">{quantity}</output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity === 9}
            onClick={() => { setQuantity((value) => Math.min(9, value + 1)); setAdded(false); }}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="product-purchase-actions">
        <button className="button primary mono" type="button" onClick={addSelection}>
          {added ? <Check size={18} aria-hidden="true" /> : <ShoppingCart size={18} aria-hidden="true" />}
          {added ? "Added to cart" : "Add to cart"}
        </button>
        <button className="button ghost mono" type="button" onClick={buyNow}>
          <ShoppingBag size={18} aria-hidden="true" />
          Buy now
        </button>
      </div>
      <p className="product-purchase-feedback" aria-live="polite">
        {added ? `${quantity} ${quantity === 1 ? "item" : "items"} added to your cart.` : ""}
      </p>
    </div>
  );
}
