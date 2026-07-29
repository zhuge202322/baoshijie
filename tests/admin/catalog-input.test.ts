import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCategoryForm,
  parseProductForm,
  parseUsdToCents
} from "../../lib/admin/catalog-input.ts";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("USD form prices are converted to integer cents without rounding", () => {
  assert.equal(parseUsdToCents("1295"), 129500);
  assert.equal(parseUsdToCents("1295.50"), 129550);
  assert.throws(() => parseUsdToCents("12.345"), /valid USD amount/);
  assert.throws(() => parseUsdToCents("-1"), /valid USD amount/);
});

test("category forms normalize booleans and integer sort order", () => {
  assert.deepEqual(
    parseCategoryForm(form({
      name: "  Interior Trim  ",
      slug: "interior-trim",
      description: "Cabin components",
      sortOrder: "12",
      isActive: "on"
    })),
    {
      name: "Interior Trim",
      slug: "interior-trim",
      description: "Cabin components",
      sortOrder: 12,
      isActive: true
    }
  );
});

test("product forms parse compatibility lines and specification pairs", () => {
  const value = parseProductForm(form({
    categoryId: "category-interior",
    slug: "dash-trim",
    name: "Dash Trim",
    partNo: "BE-911-100",
    productType: "Bespoke",
    material: "Carbon fiber",
    price: "899.95",
    imageUrl: "/images/products/dash.png",
    shortDescription: "Precision dash trim.",
    description: "A direct-fit replacement for classic 911 dashboards.",
    compatibility: "911 1965-1973\n\n911 1974-1989",
    specs: "Material: Carbon fiber\nFinish: Satin",
    badge: "New",
    inventoryStatus: "made_to_order",
    isActive: "on"
  }));

  assert.equal(value.priceCents, 89995);
  assert.deepEqual(value.compatibility, ["911 1965-1973", "911 1974-1989"]);
  assert.deepEqual(value.specs, { Material: "Carbon fiber", Finish: "Satin" });
  assert.equal(value.isActive, true);
});

test("product forms reject malformed specification lines", () => {
  const data = form({
    categoryId: "category-interior",
    slug: "dash-trim",
    name: "Dash Trim",
    partNo: "BE-911-100",
    productType: "Bespoke",
    material: "Carbon fiber",
    price: "899.95",
    imageUrl: "/images/products/dash.png",
    shortDescription: "Precision dash trim.",
    description: "A direct-fit replacement.",
    compatibility: "911",
    specs: "Material Carbon fiber",
    inventoryStatus: "in_stock"
  });

  assert.throws(() => parseProductForm(data), /Specification lines/);
});
