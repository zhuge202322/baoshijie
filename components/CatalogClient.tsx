"use client";

import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { StorefrontProduct } from "@/lib/catalog/model";

const vehicles = [
  "Porsche 911 (993)",
  "Porsche 911 (964)",
  "Porsche 911 (G-model)",
  "Porsche 911 (997)",
  "Porsche 911 (996)"
] as const;

export function CatalogClient({
  featured,
  initialType
}: {
  featured: StorefrontProduct[];
  initialType?: StorefrontProduct["productType"];
}) {
  const [category, setCategory] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<string>(vehicles[0]);
  const [query, setQuery] = useState("");
  const categories = useMemo(() => [...new Set(featured.map((product) => product.category))].sort(), [featured]);

  const filtered = useMemo(() => {
    return featured.filter((product) => {
      const categoryMatch = category === null || product.category === category;
      const typeMatch = !initialType || product.productType === initialType;
      const queryMatch =
        query.trim().length === 0 ||
        `${product.name} ${product.partNo} ${product.short}`.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && typeMatch && queryMatch;
    });
  }, [category, featured, initialType, query]);

  return (
    <div className="grid-12">
      <aside className="panel panel-pad reveal catalog-sidebar" style={{ gridColumn: "span 3", alignSelf: "start" }}>
        <div className="catalog-filter-title">
          <SlidersHorizontal size={18} color="#ffb3ac" aria-hidden="true" />
          <h2 className="headline">Filters</h2>
        </div>

        <div className="catalog-vehicle">
          <p className="eyebrow">Vehicle Configuration</p>
          <select
            aria-label="Vehicle configuration"
            value={vehicle}
            onChange={(event) => setVehicle(event.target.value)}
          >
            {vehicles.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <p className="muted">Results are tuned for exact classic 911 chassis fitment.</p>
        </div>

        <div className="field catalog-search">
          <label htmlFor="catalog-search">Search</label>
          <input
            id="catalog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Part, material, model"
          />
        </div>

        <FilterGroup title="Category" options={categories} value={category} onChange={setCategory} />
      </aside>

      <div style={{ gridColumn: "span 9" }}>
        <div className="catalog-summary reveal">
          <div>
            <p className="eyebrow">{initialType ? `${initialType} products` : category ?? "Parts catalog"}</p>
            <h1 className="headline">Products</h1>
          </div>
          <p className="mono muted">{filtered.length} items available</p>
        </div>

        <div className="catalog-grid">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
          {filtered.length === 0 && (
            <div className="panel panel-pad catalog-empty">
              <h2 className="headline">No matching parts</h2>
              <p className="muted">Try another category or use the search field.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange
}: {
  title: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="catalog-filter-group">
      <p className="eyebrow">{title}</p>
      <div>
        {options.map((option) => (
          <label key={option} className="mono">
            <input
              type="radio"
              name={title}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
