export type Product = {
  slug: string;
  name: string;
  partNo: string;
  category: "Interior Components" | "Performance Tuning" | "Exterior Aero" | "Workshop Essentials";
  material: "Carbon Fiber" | "Machined Metal" | "Composite Polymer";
  price: number;
  image: string;
  short: string;
  description: string;
  compatibility: string[];
  specs: Record<string, string>;
  badge?: string;
};

export const products: Product[] = [
  {
    slug: "carbon-fiber-heritage-steering-wheel",
    name: "Carbon Fiber Heritage Steering Wheel",
    partNo: "CF-H-911-380",
    category: "Interior Components",
    material: "Carbon Fiber",
    price: 2450,
    badge: "Limited Heritage Edition",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAwaNcPmUbai4WefF6ElbCTyNCYgZZXf_7aFXIqPF_70I4wb2FLKqNqyvg9zdX0rmbKDvIF0JasDGlQcJvdSAQ3aKT0CZGZSgU2IW1yZSyF1sl0BR4g1N-_uT-zMOjc8A981qlRHZ6zi-7jgT9DfWJDhedybPeFgyIMf1p6xQjqLrSSnwCS07HNU7zZLqZF6yWKme2AuLiXMrOsk55d0TfSmYu7p3yIwP8R7K9MZhpXvZZC3iXbxCweQ",
    short: "Period-correct silhouette, pre-preg carbon rim, perforated leather grips.",
    description:
      "A driver touchpoint rebuilt for air-cooled classics. The rim uses a satin carbon layup with hand-stitched leather grips and a machined center hub for precise vintage fitment.",
    compatibility: ["911 G-Series", "930 Turbo", "964 Classic"],
    specs: {
      Material: "3K pre-preg carbon",
      Finish: "Satin varnish",
      Diameter: "380 mm",
      LeadTime: "4-6 weeks"
    }
  },
  {
    slug: "billet-aluminum-pedals",
    name: "Billet Aluminum Pedals",
    partNo: "BA-PERF-01",
    category: "Performance Tuning",
    material: "Machined Metal",
    price: 890,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCg5U9i4wnwKAEF6WU_632pYgQc-8SLScsY2OCxRgoApM62vHii1vx_04C0_XjJAtHm3VPO5zPcfP85D_TWPflBbnG-9vDovYo7hcyCi_4jrVB3biH1lKp3JZXqMV_qR1f5NJqs8fhHxoht0UP0kc7kzUHi88wOS6EGn-yPpSA2Aistpt-cBRYjZsgkBh4SSzaE9KpCKTbnmu3QJLMxE7FXlDDWB0cPlOMFuKqxThVDxm8k1NSAPJZYcw",
    short: "CNC milled pedal set with a cold-brushed finish and mechanical grip profile.",
    description:
      "A rigid pedal interface milled from 6061-T6 aluminum, tuned for heel-toe feedback and exact pedal spacing on classic Porsche footwells.",
    compatibility: ["911 Carrera", "964 Classic", "993 RS"],
    specs: {
      Material: "6061-T6 aluminum",
      Finish: "Brushed silver",
      Weight: "620 g set",
      Hardware: "Black zinc fasteners"
    }
  },
  {
    slug: "lightweight-door-panels",
    name: "Lightweight Door Panels",
    partNo: "CF-911-EXT-LP",
    category: "Interior Components",
    material: "Composite Polymer",
    price: 1420,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOYdYAMRsR6cGQqvSdA33389enNGheN4HHViuDpOfF9yelZmPUgpZMV9X7OeIQt5fghGUuxNZNTCQ9sp9Ok3gL2Jd0H2IpbknV1vqdjELptqvhMJzGytzk6Y3MpWuokQ8UfTagwyQrjvzKefPBb0E0uhYh1wH436bY65qHtiCHXm_gPmCpq-JbMYmRBR7WmPYY9k4Af6nUh6pc6Jlb2KVog4j6bUcyOQGV1FPbxsPOVf4pH3ZyxFwysw",
    short: "Minimal race panel with red pull straps and hidden reinforcement.",
    description:
      "A weight-saving interior conversion with a matte composite shell, clean pull hardware, and optional leather edge trim for grand touring builds.",
    compatibility: ["911 Carrera", "930 Turbo", "G-Series"],
    specs: {
      Material: "Composite laminate",
      Saving: "4.1 kg per pair",
      Finish: "Matte black",
      Install: "Factory mounting points"
    }
  },
  {
    slug: "forged-magnesium-center-lock",
    name: "Forged Magnesium Center Lock",
    partNo: "MG-CL-993",
    category: "Performance Tuning",
    material: "Machined Metal",
    price: 480,
    badge: "Serialized",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCag3kG6RCdMzLqa3vtI2m9oQM5Oz3tmmFH0MNdfPEwgfYepA72K9vgEdQGr7LrgIZim0yEeKi3axDkwYOXSqYAJxvGkiHAGCi0gqZ4l8MuWUcMKfaUPattj1T2iQhm6O-ppuivquxNbZuzRGOcH280ZOLsVyk2-7akGBiSdYFt3q9GkpWtzgf86kZhGL3j2de5uiSvzTtwKYvQRPZUiHOypzb4F1EYhZ1tHZMo_-rGMONeLc5x3D1fpw",
    short: "Forged magnesium hardware with titanium-gray anodized surface.",
    description:
      "A motorsport-inspired wheel retention component machined to low rotational mass tolerances and finished with a durable hard-anodized coating.",
    compatibility: ["964 Classic", "993 RS"],
    specs: {
      Material: "Forged magnesium",
      Finish: "Titanium gray",
      Torque: "500 Nm",
      Origin: "Stuttgart run"
    }
  },
  {
    slug: "rs-carbon-rear-spoiler",
    name: "RS Carbon Rear Spoiler",
    partNo: "CF-AERO-964",
    category: "Exterior Aero",
    material: "Carbon Fiber",
    price: 1850,
    badge: "Limited",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBa8K6Bu8Ll52gfpGZZ_hvpOiEqplhz79X62NYuz5ypMhQ41hYauDkVNwYtditmgMtIjDnz09YpptPDFxjjjg8yycnaGNYC1yyn7fUg3bYu1YpXiehHD1RsogTXm9K2SuZEJLcr7vjyOITBfJEMfcOpEKhQPsqphrPkU5GkY5zA6NLJcNevEUCF3WDA5PloKnNcBoyyQzn84NQurh4MjGmmezImoVyqSrNDOPdlKWZ4p7cx9wMiY-wX3g",
    short: "Gloss carbon aero blade tuned for vintage decklid geometry.",
    description:
      "A reversible aero upgrade that adds modern stiffness and a period-conscious profile without permanently altering the original decklid.",
    compatibility: ["911 Carrera", "964 Classic"],
    specs: {
      Material: "Autoclave carbon",
      Finish: "Gloss clear",
      Mounting: "Bolt-on",
      Weight: "2.2 kg"
    }
  },
  {
    slug: "guards-red-gauge-cluster",
    name: "Guards Red Gauge Cluster",
    partNo: "GR-GAUGE-911",
    category: "Interior Components",
    material: "Composite Polymer",
    price: 1250,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCLZKWlPyCo415y86CAPl5HLVS-pUIFsYv4Q-QMRSF81s18l1F4cMXgO_13mse2ljHlji-ECgAxqPOab6rfLW369ulYlqmJuIH8h84tPqUDnfYaVNB0Oq4gOCXVTOGFHoQbD1rQsMcjHbCI74vOOWo3rqoCLfSDs0VzNEMze6Vc8WJiI50XTgSgMch4J2q5XHdzwxFOlMA2wQ3eadwwVkCzRjXtjxiOvSlMd2NfsO69nrXisjVDnN2qpQ",
    short: "Custom gauge faces, machined bezels, and redline calibration.",
    description:
      "A cockpit focal point with updated illumination, heritage typography, and data-calibrated red faces for custom performance builds.",
    compatibility: ["911 Carrera", "930 Turbo", "964 Classic", "993 RS"],
    specs: {
      Illumination: "Warm LED",
      Face: "Guards red",
      Bezel: "Machined aluminum",
      Calibration: "Build specific"
    }
  },
  {
    slug: "rs-64-air-intake",
    name: "RS-64 Air Intake",
    partNo: "911-CF-INT-01",
    category: "Performance Tuning",
    material: "Carbon Fiber",
    price: 1850,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBdrJvgiixteo12sM-Gt344u077_nwks5ot_i9x_4x990n9BlMGneeusURSl1whfeBfsIa8s67XWQ7SkmmEE5t_JUsw48fI6YVzU0jz13dEH0QYaNejVHS7SSw-1mOfGGPltDjxAogEKWTK1mWTk3y908M42JnwUmcWvax4_4pn9Q9MIqzaaO4E02AFQnc-KZ-Kn8pcdhDfrb3aR3qtGrVdS4z1LCm0ROgJBAPLHGca0vDVyYX596QeGQ",
    short: "Forged carbon intake tuned for 1989-1994 Porsche 964 models.",
    description:
      "A high-flow carbon induction assembly that trims weight and sharpens throttle response for naturally aspirated air-cooled builds.",
    compatibility: ["964 Classic"],
    specs: {
      Material: "Forged carbon",
      Filter: "High-flow cone",
      Weight: "1.8 kg",
      Tune: "No ECU change required"
    }
  },
  {
    slug: "precision-short-shifter",
    name: "Precision Short Shifter",
    partNo: "911-SS-KNOB-05",
    category: "Interior Components",
    material: "Machined Metal",
    price: 620,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5M7t1YMft3pQxZjkIijQzZh3Wy-izEo9SNd0cvQ7BKnGAi50ubrIHdQv_OXqnDtwK7vLs71ZtrbKIGD8y0aNYqXiGSxMDbI6JAR_c4mmA5yMRuTHJ8BFudLTEgCRpyEs-dV2g5vx2pMMSGlXIHUiRdtV_5fyBGeKT3dB7vCOQqQwMyFcLZnSl_n02keCx2UtbI1r7Z-bvMFK_NNrbqzr7cVNR3SOMZYdLBN1jUc9jNfRQX3knK1DWxQ",
    short: "Weighted billet shifter with Guards Red inlay and crisp detent feel.",
    description:
      "Machined for short, deliberate throws while retaining the analogue texture that makes a vintage gearbox feel alive.",
    compatibility: ["911 Carrera", "930 Turbo", "964 Classic"],
    specs: {
      Material: "Billet aluminum",
      Throw: "32% shorter",
      Finish: "Brushed silver",
      Mass: "410 g"
    }
  }
];

export const featuredProduct = products[0];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}
