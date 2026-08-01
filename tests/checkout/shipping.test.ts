import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { getShippingRates, updateShippingRates } from "../../lib/checkout/shipping.ts";

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  return database;
}

test("shipping rates are seeded with the current standard and expedited defaults", () => {
  const database = setup();
  try {
    assert.deepEqual(getShippingRates(database), { standard: 1200, expedited: 4500 });
  } finally {
    database.close();
  }
});

test("shipping rates can be updated independently from the storefront", () => {
  const database = setup();
  try {
    updateShippingRates(database, { standard: 1899, expedited: 5275 });
    assert.deepEqual(getShippingRates(database), { standard: 1899, expedited: 5275 });
  } finally {
    database.close();
  }
});
