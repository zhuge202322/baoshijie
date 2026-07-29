import type { CategoryInput, ProductInput } from "../catalog/repository.ts";

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function integer(value: string, label: string) {
  if (!/^-?\d+$/.test(value)) throw new Error(`${label} must be an integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} must be an integer`);
  return parsed;
}

export function parseUsdToCents(value: string) {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Price must be a valid USD amount with no more than two decimal places");
  }
  const [dollars, fraction = ""] = normalized.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error("Price must be a valid USD amount");
  return cents;
}

function parseLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseSpecs(value: string) {
  return Object.fromEntries(parseLines(value).map((line) => {
    const separator = line.indexOf(":");
    if (separator < 1 || separator === line.length - 1) {
      throw new Error("Specification lines must use Label: Value format");
    }
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
}

export function parseCategoryForm(data: FormData): CategoryInput {
  return {
    name: text(data, "name"),
    slug: text(data, "slug"),
    description: text(data, "description"),
    sortOrder: integer(text(data, "sortOrder") || "0", "Sort order"),
    isActive: data.has("isActive")
  };
}

export function parseProductForm(data: FormData): ProductInput {
  return {
    categoryId: text(data, "categoryId"),
    slug: text(data, "slug"),
    name: text(data, "name"),
    partNo: text(data, "partNo"),
    productType: text(data, "productType") as ProductInput["productType"],
    material: text(data, "material"),
    priceCents: parseUsdToCents(text(data, "price")),
    imageUrl: text(data, "imageUrl"),
    shortDescription: text(data, "shortDescription"),
    description: text(data, "description"),
    compatibility: parseLines(text(data, "compatibility")),
    specs: parseSpecs(text(data, "specs")),
    badge: text(data, "badge"),
    inventoryStatus: text(data, "inventoryStatus") as ProductInput["inventoryStatus"],
    isActive: data.has("isActive")
  };
}
