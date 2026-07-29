export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  partNo: string;
  category: string;
  productType: "Bespoke" | "OE aftermarket";
  material: string;
  priceCents: number;
  image: string;
  short: string;
  description: string;
  compatibility: string[];
  specs: Record<string, string>;
  badge?: string;
  inventoryStatus: "in_stock" | "made_to_order" | "unavailable";
};

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}
