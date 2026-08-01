import assert from "node:assert/strict";
import test from "node:test";
import { createGuestOrder } from "../../lib/checkout/create-order.ts";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { archiveProduct } from "../../lib/catalog/repository.ts";
import { updateShippingRates } from "../../lib/checkout/shipping.ts";

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  return database;
}

const customer = {
  email: "driver@example.com",
  phone: "+1 310 555 0100",
  firstName: "Ferdinand",
  lastName: "Porsche",
  countryCode: "US",
  region: "CA",
  city: "Los Angeles",
  postalCode: "90001",
  addressLine1: "1 Main Street",
  addressLine2: "",
  customerNote: "Confirm fitment before dispatch"
};

test("guest order reprices products from SQLite and stores immutable item snapshots", () => {
  const database = setup();
  try {
    const order = createGuestOrder(database, {
      lines: [{ slug: "precision-short-shifter", quantity: 2, clientPriceCents: 1 }],
      shippingMethod: "standard",
      paymentProvider: "paypal",
      customer
    }, {
      now: 1_800_000_000_000,
      orderId: "order-test",
      itemId: (index) => `item-${index}`,
      orderNumber: "BE-TEST-1001",
      lookupToken: "private-lookup-token"
    });

    assert.deepEqual(order.totals, {
      currency: "USD",
      subtotalCents: 124000,
      shippingCents: 1200,
      totalCents: 125200
    });
    assert.equal(order.lookupToken, "private-lookup-token");

    const stored = database.prepare("SELECT * FROM orders WHERE id = ?").get("order-test");
    assert.equal(stored?.total_cents, 125200);
    assert.notEqual(stored?.lookup_token_hash, "private-lookup-token");
    const item = database.prepare("SELECT * FROM order_items WHERE order_id = ?").get("order-test");
    assert.equal(item?.unit_price_cents, 62000);
    assert.equal(item?.line_total_cents, 124000);
    assert.equal(item?.name, "Precision Short Shifter");
  } finally {
    database.close();
  }
});

test("guest orders use the shipping rate configured in SQLite", () => {
  const database = setup();
  try {
    updateShippingRates(database, { standard: 1899, expedited: 5275 });
    const order = createGuestOrder(database, {
      lines: [{ slug: "precision-short-shifter", quantity: 1 }],
      shippingMethod: "standard",
      paymentProvider: "paypal",
      customer
    });
    assert.equal(order.totals.shippingCents, 1899);
    assert.equal(order.totals.totalCents, 63899);
  } finally {
    database.close();
  }
});

test("empty, missing, inactive, and unavailable products leave no partial order", () => {
  const database = setup();
  try {
    assert.throws(() => createGuestOrder(database, {
      lines: [], shippingMethod: "standard", paymentProvider: "paypal", customer
    }), /empty/);
    assert.throws(() => createGuestOrder(database, {
      lines: [{ slug: "missing-product", quantity: 1 }], shippingMethod: "standard", paymentProvider: "paypal", customer
    }), /not available/);

    archiveProduct(database, "product-precision-short-shifter", true);
    assert.throws(() => createGuestOrder(database, {
      lines: [{ slug: "precision-short-shifter", quantity: 1 }], shippingMethod: "standard", paymentProvider: "paypal", customer
    }), /not available/);
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM orders").get()?.count, 0);
  } finally {
    database.close();
  }
});

test("US and Canada require a region while supported European destinations do not", () => {
  const database = setup();
  try {
    assert.throws(() => createGuestOrder(database, {
      lines: [{ slug: "precision-short-shifter", quantity: 1 }],
      shippingMethod: "expedited",
      paymentProvider: "airwallex",
      customer: { ...customer, region: "" }
    }), /State or province/);

    const european = createGuestOrder(database, {
      lines: [{ slug: "precision-short-shifter", quantity: 1 }],
      shippingMethod: "expedited",
      paymentProvider: "airwallex",
      customer: { ...customer, countryCode: "DE", region: "", city: "Stuttgart", postalCode: "70435" }
    });
    assert.equal(european.totals.shippingCents, 4500);

    assert.throws(() => createGuestOrder(database, {
      lines: [{ slug: "precision-short-shifter", quantity: 1 }],
      shippingMethod: "standard",
      paymentProvider: "paypal",
      customer: { ...customer, countryCode: "CN" }
    }), /destination/);
  } finally {
    database.close();
  }
});

test("validation failures roll back all order and item inserts", () => {
  const database = setup();
  try {
    assert.throws(() => createGuestOrder(database, {
      lines: [
        { slug: "precision-short-shifter", quantity: 1 },
        { slug: "missing-product", quantity: 1 }
      ],
      shippingMethod: "standard",
      paymentProvider: "paypal",
      customer
    }), /not available/);
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM orders").get()?.count, 0);
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM order_items").get()?.count, 0);
  } finally {
    database.close();
  }
});
