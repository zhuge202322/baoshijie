import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { getProductById, updateProduct } from "../../lib/catalog/repository.ts";
import { getMediaMap, getStorefrontContent, listStorefrontProducts } from "../../lib/catalog/storefront.ts";
import { updateMediaSlot, updateSiteSettings } from "../../lib/content/repository.ts";

test("storefront projections reflect catalog, brand, contact, social, and media edits", () => {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  try {
    const current = getProductById(database, "product-carbon-fiber-heritage-steering-wheel");
    assert.ok(current);
    updateProduct(database, current.id, { ...current, priceCents: 321099 });
    updateSiteSettings(database, {
      websiteName: "Bespoke Elemental Europe",
      logoUrl: "/media/new-logo.webp",
      supportEmail: "parts@example.com",
      supportPhone: "+44 20 1234 5678",
      supportWhatsapp: "+44 20 1234 5678",
      companyAddress: "London, UK"
    });
    updateMediaSlot(database, "home.hero.1", { imageUrl: "/media/new-hero.webp", altText: "New hero" });

    const products = listStorefrontProducts(database);
    assert.equal(products.find((product) => product.id === current.id)?.priceCents, 321099);
    assert.equal(products.find((product) => product.id === current.id)?.category, "Interior Components");

    const content = getStorefrontContent(database);
    assert.equal(content.settings.websiteName, "Bespoke Elemental Europe");
    assert.equal(content.settings.logoUrl, "/media/new-logo.webp");
    assert.equal(content.settings.supportEmail, "parts@example.com");
    assert.equal(content.socialLinks.length, 2);
    assert.deepEqual(getMediaMap(database)["home.hero.1"], {
      imageUrl: "/media/new-hero.webp",
      altText: "New hero"
    });
  } finally {
    database.close();
  }
});
