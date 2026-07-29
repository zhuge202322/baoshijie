import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";

test("seed is idempotent and reproduces the current storefront", () => {
  const database = createDatabase(":memory:");
  migrateDatabase(database);

  try {
    seedDatabase(database);
    seedDatabase(database);

    assert.equal(database.prepare("SELECT COUNT(*) count FROM products").get()?.count, 8);
    assert.equal(database.prepare("SELECT COUNT(*) count FROM categories").get()?.count, 4);
    assert.equal(database.prepare("SELECT COUNT(*) count FROM site_settings").get()?.count, 1);
    assert.equal(database.prepare("SELECT COUNT(*) count FROM social_links").get()?.count, 2);
    assert.equal(database.prepare("SELECT COUNT(*) count FROM media_slots").get()?.count, 14);

    const site = database.prepare("SELECT website_name, logo_url FROM site_settings WHERE id = 1").get();
    assert.equal(site?.website_name, "Bespoke Elemental");
    assert.equal(site?.logo_url, "/brand/flame-logo.png");
  } finally {
    database.close();
  }
});
