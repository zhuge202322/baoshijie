"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Product, formatCurrency } from "@/data/products";
import { useCart } from "@/components/CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
        <div className="product-image">
          <img src={product.image} alt={product.name} loading="lazy" />
        </div>
      </Link>
      <div className="product-body">
        <div>
          <p className="eyebrow" style={{ margin: "0 0 10px" }}>
            {product.partNo}
          </p>
          <h3 className="headline" style={{ margin: 0, fontSize: "1.35rem" }}>
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
          {product.short}
        </p>
        <div className="price-row">
          <span className="price">{formatCurrency(product.price)}</span>
          <button
            className="button primary mono"
            type="button"
            style={{ minHeight: 44, paddingInline: 14, fontSize: 12 }}
            onClick={() => addItem(product.slug)}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
