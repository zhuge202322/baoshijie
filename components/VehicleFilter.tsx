"use client";

import { useState } from "react";

const models = ["911 Carrera", "930 Turbo", "964 Classic", "993 RS", "G-Series"];

export function VehicleFilter() {
  const [active, setActive] = useState(models[2]);

  return (
    <div className="model-strip" aria-label="Vehicle model selector">
      <div className="model-strip-inner">
        <span className="eyebrow" style={{ color: "#c9b8b6", flex: "0 0 auto" }}>
          Select Model:
        </span>
        {models.map((model) => (
          <button
            key={model}
            type="button"
            className={`model-pill mono ${active === model ? "active" : ""}`}
            onClick={() => setActive(model)}
          >
            {model}
          </button>
        ))}
      </div>
    </div>
  );
}
