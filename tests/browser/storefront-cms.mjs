import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { getProductById, updateProduct } from "../../lib/catalog/repository.ts";
import { getSiteSettings, listMediaSlots, updateMediaSlot, updateSiteSettings } from "../../lib/content/repository.ts";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";
const databasePath = process.env.TEST_DATABASE_PATH || "D:/kehu/baoshijie/storage/admin-browser-test.sqlite";

test("catalog and CMS edits render on the public storefront", async () => {
  const database = createDatabase(databasePath);
  migrateDatabase(database);
  seedDatabase(database);
  const settings = getSiteSettings(database);
  const product = getProductById(database, "product-carbon-fiber-heritage-steering-wheel");
  const hero = listMediaSlots(database).find((slot) => slot.slotKey === "home.hero.1");
  assert.ok(product);
  assert.ok(hero);

  updateSiteSettings(database, {
    ...settings,
    websiteName: "Browser CMS Elemental",
    supportEmail: "cms-browser@example.com"
  });
  updateProduct(database, product.id, { ...product, priceCents: 321099 });
  updateMediaSlot(database, hero.slotKey, {
    imageUrl: "/images/bespoke-elemental/hero-02.png",
    altText: "CMS browser hero"
  });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(baseUrl);
    await page.getByRole("link", { name: "Browser CMS Elemental home" }).waitFor();
    assert.equal(await page.locator(".hero-carousel-slide").first().locator("img").getAttribute("src"), "/images/bespoke-elemental/hero-02.png");
    await page.getByText("cms-browser@example.com").last().waitFor();

    await page.goto(`${baseUrl}/catalog`);
    const card = page.locator("article", { hasText: "Carbon Fiber Heritage Steering Wheel" });
    await card.getByText("$3,210.99").waitFor();
  } finally {
    updateSiteSettings(database, settings);
    updateProduct(database, product.id, product);
    updateMediaSlot(database, hero.slotKey, { imageUrl: hero.imageUrl, altText: hero.altText });
    database.close();
    await browser.close();
  }
});
