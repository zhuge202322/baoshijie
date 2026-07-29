import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import {
  archiveProduct,
  createCategory,
  deleteCategory,
  getProductById,
  listCategories,
  listProducts,
  removeProduct,
  updateProduct
} from "../../lib/catalog/repository.ts";

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  return database;
}

test("categories can be created but categories with products cannot be deleted", () => {
  const database = setup();
  try {
    const category = createCategory(database, {
      name: "Workshop Tools",
      slug: "workshop-tools",
      description: "Tools for installation",
      sortOrder: 50,
      isActive: true
    });
    assert.equal(listCategories(database).some((item) => item.id === category.id), true);
    deleteCategory(database, category.id);
    assert.equal(listCategories(database).some((item) => item.id === category.id), false);

    assert.throws(
      () => deleteCategory(database, "category-interior-components"),
      /Move or archive its products first/
    );
  } finally {
    database.close();
  }
});

test("product updates store integer cents and archive removes it from the public catalog", () => {
  const database = setup();
  try {
    const id = "product-carbon-fiber-heritage-steering-wheel";
    const current = getProductById(database, id);
    assert.ok(current);

    updateProduct(database, id, {
      ...current,
      priceCents: 259900,
      compatibility: ["911 G-Series"],
      specs: { Material: "3K pre-preg carbon" }
    });
    assert.equal(getProductById(database, id)?.priceCents, 259900);

    archiveProduct(database, id, true);
    assert.equal(getProductById(database, id)?.isActive, false);
    assert.equal(listProducts(database).some((item) => item.id === id), false);
    assert.equal(listProducts(database, { includeInactive: true }).some((item) => item.id === id), true);
  } finally {
    database.close();
  }
});

test("catalog validation rejects invalid slugs and negative prices", () => {
  const database = setup();
  try {
    assert.throws(
      () =>
        createCategory(database, {
          name: "Invalid",
          slug: "Not Valid",
          description: "",
          sortOrder: 0,
          isActive: true
        }),
      /lowercase URL slug/
    );

    const current = getProductById(database, "product-billet-aluminum-pedals");
    assert.ok(current);
    assert.throws(() => updateProduct(database, current.id, { ...current, priceCents: -1 }), /non-negative integer/);
  } finally {
    database.close();
  }
});

test("product removal deletes unused products and archives products referenced by orders", () => {
  const database = setup();
  try {
    const unusedId = "product-billet-aluminum-pedals";
    assert.equal(removeProduct(database, unusedId), "deleted");
    assert.equal(getProductById(database, unusedId), null);

    const orderedId = "product-carbon-fiber-heritage-steering-wheel";
    database.prepare(`
      INSERT INTO orders (
        id, order_number, lookup_token_hash, status, payment_provider,
        subtotal_cents, shipping_cents, total_cents, shipping_method,
        email, phone, first_name, last_name, country_code, city, postal_code,
        address_line_1, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "order-test", "BE-TEST-1", "hash", "PAID", "paypal",
      10000, 1200, 11200, "standard", "owner@example.com", "123",
      "Test", "Owner", "US", "Los Angeles", "90001", "1 Main St", 1, 1
    );
    database.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_slug, part_no, name, quantity,
        unit_price_cents, line_total_cents, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "item-test", "order-test", orderedId, "heritage-steering-wheel", "BE-TEST",
      "Heritage Steering Wheel", 1, 10000, 10000, 1
    );

    assert.equal(removeProduct(database, orderedId), "archived");
    assert.equal(getProductById(database, orderedId)?.isActive, false);
  } finally {
    database.close();
  }
});
