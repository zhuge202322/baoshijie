"use client";

import { Check, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/data/products";

const chassis = ["911 Carrera", "930 Turbo", "964 Classic", "993 RS"];
const materials = [
  { label: "Satin Carbon", price: 1850 },
  { label: "Forged Carbon", price: 2260 },
  { label: "Billet Aluminum", price: 1480 }
];
const trims = [
  { label: "Guards Red Stitch", price: 220 },
  { label: "Black Alcantara", price: 340 },
  { label: "Brushed Metal Inlay", price: 410 }
];

export function BuildConfigurator() {
  const [selectedChassis, setSelectedChassis] = useState(chassis[2]);
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0]);
  const [selectedTrim, setSelectedTrim] = useState(trims[0]);

  const total = useMemo(
    () => selectedMaterial.price + selectedTrim.price + 650,
    [selectedMaterial.price, selectedTrim.price]
  );

  return (
    <section className="section" id="custom-works">
      <div className="container grid-12">
        <div className="reveal" style={{ gridColumn: "span 5" }}>
          <p className="eyebrow" style={{ color: "#d5001c" }}>
            Custom Works
          </p>
          <h2 className="display" style={{ margin: "14px 0 20px", fontSize: "clamp(2.5rem, 6vw, 5.8rem)" }}>
            Bespoke Fitment Studio
          </h2>
          <p className="muted" style={{ lineHeight: 1.7, maxWidth: 560 }}>
            Configure a commission package around chassis, material, finish, and delivery window.
            The summary is built like a workshop order sheet for high-value custom builds.
          </p>
        </div>

        <div className="panel panel-pad reveal" style={{ gridColumn: "span 7" }}>
          <div style={{ display: "grid", gap: 26 }}>
            <OptionRail title="Chassis" options={chassis} value={selectedChassis} onChange={setSelectedChassis} />
            <OptionRail
              title="Material"
              options={materials.map((item) => item.label)}
              value={selectedMaterial.label}
              onChange={(value) => setSelectedMaterial(materials.find((item) => item.label === value) ?? materials[0])}
            />
            <OptionRail
              title="Trim"
              options={trims.map((item) => item.label)}
              value={selectedTrim.label}
              onChange={(value) => setSelectedTrim(trims.find((item) => item.label === value) ?? trims[0])}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 18,
                alignItems: "center",
                borderTop: "1px solid rgba(126,90,86,.3)",
                paddingTop: 24
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: "0 0 10px" }}>
                  Commission Estimate
                </p>
                <strong className="headline" style={{ fontSize: "2rem" }}>
                  {formatCurrency(total)}
                </strong>
                <p className="muted mono" style={{ margin: "8px 0 0", fontSize: 12 }}>
                  {selectedChassis} / {selectedMaterial.label} / {selectedTrim.label}
                </p>
              </div>
              <button className="button primary mono" type="button">
                <Wrench size={18} aria-hidden="true" />
                Request Build
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OptionRail({
  title,
  options,
  value,
  onChange
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="eyebrow" style={{ margin: "0 0 12px" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`button mono ${value === option ? "primary" : "ghost"}`}
            style={{ minHeight: 44, fontSize: 12 }}
            onClick={() => onChange(option)}
          >
            {value === option && <Check size={15} aria-hidden="true" />}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
