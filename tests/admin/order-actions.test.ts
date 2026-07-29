import assert from "node:assert/strict";
import test from "node:test";
import { createGuestOrder } from "../../lib/checkout/create-order.ts";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import {
  applyPaymentResult,
  createPaymentAttempt,
  getOrderById,
  getOrderDetail,
  listOrders,
  transitionOrderAsAdmin,
  updateOrderInternalNote
} from "../../lib/orders/repository.ts";

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  createGuestOrder(database, {
    lines: [{ slug: "precision-short-shifter", quantity: 2 }], shippingMethod: "expedited", paymentProvider: "paypal",
    customer: { email: "driver@example.com", phone: "1", firstName: "Test", lastName: "Driver", countryCode: "US", region: "CA", city: "LA", postalCode: "90001", addressLine1: "1 Main" }
  }, { orderId: "order-test", orderNumber: "BE-ORDER-1", lookupToken: "token", now: 1000 });
  createPaymentAttempt(database, {
    id: "payment-test", orderId: "order-test", provider: "paypal", providerPaymentId: "PAYPAL-1",
    status: "CREATED", amountCents: 128500, currency: "USD", metadata: {}, now: 2000
  });
  applyPaymentResult(database, {
    provider: "paypal", providerPaymentId: "PAYPAL-1", status: "completed", amountCents: 128500, currency: "USD", now: 3000
  });
  return database;
}

test("admin order list supports status and text filters", () => {
  const database = setup();
  try {
    assert.equal(listOrders(database).length, 1);
    assert.equal(listOrders(database, { status: "PAID" }).length, 1);
    assert.equal(listOrders(database, { status: "SHIPPED" }).length, 0);
    assert.equal(listOrders(database, { query: "driver@example.com" })[0]?.orderNumber, "BE-ORDER-1");
    assert.equal(listOrders(database, { query: "BE-ORDER" })[0]?.id, "order-test");
  } finally {
    database.close();
  }
});

test("order detail includes immutable items and payment attempts", () => {
  const database = setup();
  try {
    const detail = getOrderDetail(database, "order-test");
    assert.equal(detail?.items[0]?.name, "Precision Short Shifter");
    assert.equal(detail?.items[0]?.quantity, 2);
    assert.equal(detail?.payments[0]?.providerPaymentId, "PAYPAL-1");
    assert.equal(detail?.payments[0]?.status, "completed");
  } finally {
    database.close();
  }
});

test("admin notes and legal fulfillment transitions update without controlling payment", () => {
  const database = setup();
  try {
    updateOrderInternalNote(database, "order-test", "Fitment confirmed by phone.");
    assert.equal(getOrderById(database, "order-test")?.internalNote, "Fitment confirmed by phone.");
    transitionOrderAsAdmin(database, "order-test", "CONFIRMED", 4000);
    transitionOrderAsAdmin(database, "order-test", "PROCESSING", 5000);
    transitionOrderAsAdmin(database, "order-test", "SHIPPED", 6000);
    assert.equal(getOrderById(database, "order-test")?.status, "SHIPPED");
    assert.throws(() => transitionOrderAsAdmin(database, "order-test", "PAID"), /not allowed/);
    assert.throws(() => transitionOrderAsAdmin(database, "order-test", "REFUNDED"), /not allowed/);
  } finally {
    database.close();
  }
});
