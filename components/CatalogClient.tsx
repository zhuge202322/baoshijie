"use client";

import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Product, products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

const materials = ["Carbon Fiber", "Machined Metal", "Composite Polymer"] as const;
const categories = ["Interior Components", "Performance Tuning", "Exterior Aero", "Workshop Essentials"] as const;

export function CatalogClient({ featured = products }: { featured?: Product[] }) {
  const [material, setMaterial] = useState<string>("All");
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return featured.filter((product) => {
      const materialMatch = material === "All" || product.material === material;
      const categoryMatch = category === "All" || product.category === category;
      const queryMatch =
        query.trim().length === 0 ||
        `${product.name} ${product.partNo} ${product.short}`.toLowerCase().includes(query.toLowerCase());
      return materialMatch && categoryMatch && queryMatch;
    });
  }, [category, featured, material, query]);

  return (
    <div className="grid-12">
      <aside className="panel panel-pad reveal" style={{ gridColumn: "span 3", alignSelf: "start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
          <SlidersHorizontal size={18} color="#ffb3ac" aria-hidden="true" />
          <h2 className="headline" style={{ margin: 0, fontSize: "1rem" }}>
            Precision Filters
          </h2>
        </div>

        <div className="field" style={{ marginBottom: 28 }}>
          <label htmlFor="catalog-search">Search</label>
          <input
            id="catalog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Part, material, model"
          />
        </div>

        <FilterGroup
          title="Material"
          options={["All", ...materials]}
          value={material}
          onChange={setMaterial}
        />
        <FilterGroup
          title="Category"
          options={["All", ...categories]}
          value={category}
          onChange={setCategory}
        />

        <div
          style={{
            marginTop: 28,
            paddingTop: 22,
            borderTop: "1px solid rgba(126,90,86,.32)"
          }}
        >
          <p className="eyebrow" style={{ margin: "0 0 12px", color: "#d5001c" }}>
            Vehicle Configuration
          </p>
          <select
            aria-label="Vehicle configuration"
            defaultValue="Porsche 911 (964)"
            style={{
              width: "100%",
              minHeight: 46,
              border: "1px solid rgba(255,179,172,.45)",
              borderRadius: 4,
              padding: "0 12px",
              color: "#f1eeee",
              background: "#111"
            }}
          >
            <option>Porsche 911 (964)</option>
            <option>Porsche 930 Turbo</option>
            <option>Porsche 993 RS</option>
            <option>Porsche G-Series</option>
          </select>
          <p className="muted" style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.55 }}>
            Results are tuned for air-cooled chassis fitment.
          </p>
        </div>
      </aside>

      <div style={{ gridColumn: "span 9" }}>
        <div
          className="reveal"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "end",
            marginBottom: 28
          }}
        >
          <div>
            <p className="eyebrow" style={{ margin: "0 0 10px", color: "#d5001c" }}>
              Premium Inventory
            </p>
            <h1 className="display" style={{ margin: 0, fontSize: "clamp(2.7rem, 7vw, 5.6rem)" }}>
              The Catalog
            </h1>
          </div>
          <p className="mono muted" style={{ margin: 0, fontSize: 13 }}>
            {filtered.length} items available
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24
          }}
        >
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
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
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p className="eyebrow" style={{ margin: "0 0 14px" }}>
        {title}
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {options.map((option) => (
          <label
            key={option}
            className="mono"
            style={{
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: value === option ? "#f1eeee" : "#c9b8b6",
              cursor: "pointer",
              textTransform: "uppercase",
              fontSize: 13
            }}
          >
            <input
              type="radio"
              name={title}
              checked={value === option}
              onChange={() => onChange(option)}
              style={{ accentColor: "#d5001c", width: 18, height: 18 }}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
