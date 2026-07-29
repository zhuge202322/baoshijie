import type { CommerceDatabase } from "../db/client.ts";
import { getSiteSettings, listMediaSlots, listSocialLinks } from "../content/repository.ts";
import { getProductBySlug, listCategories, listProducts, type ProductRecord } from "./repository.ts";
import type { StorefrontProduct } from "./model.ts";

function categoryMap(database: CommerceDatabase) {
  return new Map(listCategories(database, { includeInactive: true }).map((category) => [category.id, category.name]));
}

function toStorefrontProduct(product: ProductRecord, categories: Map<string, string>): StorefrontProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    partNo: product.partNo,
    category: categories.get(product.categoryId) || "Uncategorized",
    productType: product.productType,
    material: product.material,
    priceCents: product.priceCents,
    image: product.imageUrl,
    short: product.shortDescription,
    description: product.description,
    compatibility: product.compatibility,
    specs: product.specs,
    badge: product.badge || undefined,
    inventoryStatus: product.inventoryStatus
  };
}

export function listStorefrontProducts(database: CommerceDatabase) {
  const categories = categoryMap(database);
  return listProducts(database).map((product) => toStorefrontProduct(product, categories));
}

export function getStorefrontProduct(database: CommerceDatabase, slug: string) {
  const product = getProductBySlug(database, slug);
  return product ? toStorefrontProduct(product, categoryMap(database)) : null;
}

export function getStorefrontContent(database: CommerceDatabase) {
  return {
    settings: getSiteSettings(database),
    socialLinks: listSocialLinks(database)
  };
}

export function getMediaMap(database: CommerceDatabase) {
  return Object.fromEntries(
    listMediaSlots(database).map((slot) => [slot.slotKey, { imageUrl: slot.imageUrl, altText: slot.altText }])
  ) as Record<string, { imageUrl: string; altText: string }>;
}
