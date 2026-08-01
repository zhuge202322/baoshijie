import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";

const expectedTables = [
  "categories",
  "media_assets",
  "media_slots",
  "order_items",
  "orders",
  "payments",
  "products",
  "shipping_rates",
  "site_settings",
  "social_links",
  "webhook_events"
];

test("migrations create the complete commerce schema with safe SQLite pragmas", () => {
  const directory = mkdtempSync(join(tmpdir(), "baoshijie-schema-"));
  const filename = join(directory, "commerce.sqlite");
  const database = createDatabase(filename);

  try {
    migrateDatabase(database);
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => String(row.name));

    assert.deepEqual(tables, expectedTables);
    assert.equal(database.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
    assert.equal(database.prepare("PRAGMA journal_mode").get()?.journal_mode, "wal");
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("money columns reject negative values", () => {
  const database = createDatabase(":memory:");
  migrateDatabase(database);

  try {
    const now = Date.now();
    database
      .prepare("INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run("category", "Category", "category", now, now);
    assert.throws(
      () =>
        database
          .prepare(
            `INSERT INTO products (
              id, category_id, slug, name, part_no, product_type, material,
              price_cents, image_url, short_description, description,
              compatibility_json, specs_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            "product",
            "category",
            "product",
            "Product",
            "PART-1",
            "Bespoke",
            "Carbon Fiber",
            -1,
            "/product.png",
            "Short",
            "Description",
            "[]",
            "{}",
            now,
            now
          ),
      /CHECK constraint failed/
    );
  } finally {
    database.close();
  }
});
