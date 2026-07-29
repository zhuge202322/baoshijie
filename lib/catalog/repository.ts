import { randomUUID } from "node:crypto";
import type { CommerceDatabase } from "../db/client.ts";
import {
  optionalText,
  requireImageUrl,
  requireNonNegativeInteger,
  requireSlug,
  requireSortOrder,
  requireText,
  toBoolean
} from "../validation/common.ts";

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryInput = Omit<CategoryRecord, "id">;

export type ProductRecord = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  partNo: string;
  productType: "Bespoke" | "OE aftermarket";
  material: string;
  priceCents: number;
  imageUrl: string;
  shortDescription: string;
  description: string;
  compatibility: string[];
  specs: Record<string, string>;
  badge: string;
  inventoryStatus: "in_stock" | "made_to_order" | "unavailable";
  isActive: boolean;
};

export type ProductInput = Omit<ProductRecord, "id">;

function mapCategory(row: Record<string, unknown>): CategoryRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description),
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active)
  };
}

function mapProduct(row: Record<string, unknown>): ProductRecord {
  return {
    id: String(row.id),
    categoryId: String(row.category_id),
    slug: String(row.slug),
    name: String(row.name),
    partNo: String(row.part_no),
    productType: String(row.product_type) as ProductRecord["productType"],
    material: String(row.material),
    priceCents: Number(row.price_cents),
    imageUrl: String(row.image_url),
    shortDescription: String(row.short_description),
    description: String(row.description),
    compatibility: JSON.parse(String(row.compatibility_json)) as string[],
    specs: JSON.parse(String(row.specs_json)) as Record<string, string>,
    badge: row.badge ? String(row.badge) : "",
    inventoryStatus: String(row.inventory_status) as ProductRecord["inventoryStatus"],
    isActive: Boolean(row.is_active)
  };
}

function validateCategory(input: CategoryInput): CategoryInput {
  return {
    name: requireText(input.name, "Category name", 120),
    slug: requireSlug(input.slug),
    description: optionalText(input.description, "Category description", 1000),
    sortOrder: requireSortOrder(input.sortOrder),
    isActive: toBoolean(input.isActive)
  };
}

function validateProduct(input: ProductInput): ProductInput {
  if (input.productType !== "Bespoke" && input.productType !== "OE aftermarket") {
    throw new Error("Invalid product type");
  }
  if (!(["in_stock", "made_to_order", "unavailable"] as string[]).includes(input.inventoryStatus)) {
    throw new Error("Invalid inventory status");
  }
  if (!Array.isArray(input.compatibility) || input.compatibility.some((item) => typeof item !== "string")) {
    throw new Error("Compatibility must be a list of text values");
  }
  if (!input.specs || typeof input.specs !== "object" || Array.isArray(input.specs)) {
    throw new Error("Specifications must be key/value text");
  }

  return {
    categoryId: requireText(input.categoryId, "Category", 100),
    slug: requireSlug(input.slug),
    name: requireText(input.name, "Product name", 180),
    partNo: requireText(input.partNo, "Part number", 120),
    productType: input.productType,
    material: requireText(input.material, "Material", 120),
    priceCents: requireNonNegativeInteger(input.priceCents, "Price"),
    imageUrl: requireImageUrl(input.imageUrl),
    shortDescription: requireText(input.shortDescription, "Short description", 1000),
    description: requireText(input.description, "Description", 10000),
    compatibility: input.compatibility.map((item) => item.trim()).filter(Boolean),
    specs: Object.fromEntries(
      Object.entries(input.specs).map(([key, value]) => [
        requireText(key, "Specification label", 100),
        requireText(value, "Specification value", 500)
      ])
    ),
    badge: optionalText(input.badge, "Badge", 100),
    inventoryStatus: input.inventoryStatus,
    isActive: toBoolean(input.isActive)
  };
}

export function listCategories(database: CommerceDatabase, options: { includeInactive?: boolean } = {}) {
  const rows = database
    .prepare(`SELECT * FROM categories ${options.includeInactive ? "" : "WHERE is_active = 1"} ORDER BY sort_order, name`)
    .all() as Record<string, unknown>[];
  return rows.map(mapCategory);
}

export function createCategory(database: CommerceDatabase, input: CategoryInput) {
  const value = validateCategory(input);
  const id = `category-${randomUUID()}`;
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO categories (id, name, slug, description, sort_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, value.name, value.slug, value.description, value.sortOrder, Number(value.isActive), now, now);
  return { id, ...value };
}

export function updateCategory(database: CommerceDatabase, id: string, input: CategoryInput) {
  const value = validateCategory(input);
  const result = database
    .prepare(`
      UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(value.name, value.slug, value.description, value.sortOrder, Number(value.isActive), Date.now(), id);
  if (result.changes === 0) throw new Error("Category not found");
  return { id, ...value };
}

export function deleteCategory(database: CommerceDatabase, id: string) {
  const count = Number(database.prepare("SELECT COUNT(*) count FROM products WHERE category_id = ?").get(id)?.count || 0);
  if (count > 0) throw new Error("Category has products. Move or archive its products first.");
  const result = database.prepare("DELETE FROM categories WHERE id = ?").run(id);
  if (result.changes === 0) throw new Error("Category not found");
}

export function listProducts(database: CommerceDatabase, options: { includeInactive?: boolean } = {}) {
  const rows = database
    .prepare(`SELECT * FROM products ${options.includeInactive ? "" : "WHERE is_active = 1"} ORDER BY name`)
    .all() as Record<string, unknown>[];
  return rows.map(mapProduct);
}

export function getProductById(database: CommerceDatabase, id: string) {
  const row = database.prepare("SELECT * FROM products WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapProduct(row) : null;
}

export function getProductBySlug(database: CommerceDatabase, slug: string, includeInactive = false) {
  const row = database
    .prepare(`SELECT * FROM products WHERE slug = ? ${includeInactive ? "" : "AND is_active = 1"}`)
    .get(slug) as Record<string, unknown> | undefined;
  return row ? mapProduct(row) : null;
}

export function createProduct(database: CommerceDatabase, input: ProductInput) {
  const value = validateProduct(input);
  const id = `product-${randomUUID()}`;
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO products (
        id, category_id, slug, name, part_no, product_type, material, price_cents, image_url,
        short_description, description, compatibility_json, specs_json, badge, inventory_status,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id, value.categoryId, value.slug, value.name, value.partNo, value.productType, value.material,
      value.priceCents, value.imageUrl, value.shortDescription, value.description,
      JSON.stringify(value.compatibility), JSON.stringify(value.specs), value.badge || null,
      value.inventoryStatus, Number(value.isActive), now, now
    );
  return { id, ...value };
}

export function updateProduct(database: CommerceDatabase, id: string, input: ProductInput) {
  const value = validateProduct(input);
  const result = database
    .prepare(`
      UPDATE products SET
        category_id = ?, slug = ?, name = ?, part_no = ?, product_type = ?, material = ?,
        price_cents = ?, image_url = ?, short_description = ?, description = ?,
        compatibility_json = ?, specs_json = ?, badge = ?, inventory_status = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(
      value.categoryId, value.slug, value.name, value.partNo, value.productType, value.material,
      value.priceCents, value.imageUrl, value.shortDescription, value.description,
      JSON.stringify(value.compatibility), JSON.stringify(value.specs), value.badge || null,
      value.inventoryStatus, Number(value.isActive), Date.now(), id
    );
  if (result.changes === 0) throw new Error("Product not found");
  return { id, ...value };
}

export function archiveProduct(database: CommerceDatabase, id: string, archived: boolean) {
  const result = database
    .prepare("UPDATE products SET is_active = ?, updated_at = ? WHERE id = ?")
    .run(archived ? 0 : 1, Date.now(), id);
  if (result.changes === 0) throw new Error("Product not found");
}

export function removeProduct(database: CommerceDatabase, id: string): "deleted" | "archived" {
  database.exec("BEGIN IMMEDIATE");
  try {
    const references = Number(
      database.prepare("SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?").get(id)?.count || 0
    );
    if (references > 0) {
      const result = database
        .prepare("UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?")
        .run(Date.now(), id);
      if (result.changes === 0) throw new Error("Product not found");
      database.exec("COMMIT");
      return "archived";
    }

    const result = database.prepare("DELETE FROM products WHERE id = ?").run(id);
    if (result.changes === 0) throw new Error("Product not found");
    database.exec("COMMIT");
    return "deleted";
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
