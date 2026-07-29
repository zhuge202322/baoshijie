import assert from "node:assert/strict";
import test from "node:test";
import { createGuestOrder } from "../../lib/checkout/create-order.ts";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import {
  applyPaymentResult,
  createPaymentAttempt,
  getOrderByNumber,
  getPrivateOrderStatus,
  verifyOrderLookup
} from "../../lib/orders/repository.ts";

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  const order = createGuestOrder(database, {
    lines: [{ slug: "precision-short-shifter", quantity: 1 }],
    shippingMethod: "standard",
    paymentProvider: "paypal",
    customer: {
      email: "driver@example.com", phone: "+1 310 555 0100", firstName: "Test", lastName: "Driver",
      countryCode: "US", region: "CA", city: "Los Angeles", postalCode: "90001", addressLine1: "1 Main St"
    }
  }, { orderId: "order-test", orderNumber: "BE-TEST-1", lookupToken: "lookup-secret", now: 1000 });
  return { database, order };
}

test("private order lookup requires the matching token", () => {
  const { database } = setup();
  try {
    assert.equal(verifyOrderLookup(database, "BE-TEST-1", "wrong"), null);
    assert.equal(verifyOrderLookup(database, "BE-TEST-1", "lookup-secret")?.id, "order-test");
    assert.deepEqual(getPrivateOrderStatus(database, "BE-TEST-1", "lookup-secret"), {
      orderNumber: "BE-TEST-1",
      status: "PENDING_PAYMENT",
      paymentProvider: "paypal",
      currency: "USD",
      totalCents: 63200,
      paidAt: null,
      createdAt: 1000
    });
  } finally {
    database.close();
  }
});

test("payment attempts and matching completed results atomically mark orders paid", () => {
  const { database } = setup();
  try {
    createPaymentAttempt(database, {
      id: "payment-test",
      orderId: "order-test",
      provider: "paypal",
      providerPaymentId: "PAYPAL-1",
      status: "CREATED",
      amountCents: 63200,
      currency: "USD",
      metadata: { source: "checkout" },
      now: 2000
    });
    assert.equal(getOrderByNumber(database, "BE-TEST-1")?.status, "PAYMENT_PROCESSING");
    applyPaymentResult(database, {
      provider: "paypal",
      providerPaymentId: "PAYPAL-1",
      status: "completed",
      amountCents: 63200,
      currency: "USD",
      now: 3000
    });

    assert.equal(getOrderByNumber(database, "BE-TEST-1")?.status, "PAID");
    assert.equal(getOrderByNumber(database, "BE-TEST-1")?.paidAt, 3000);
    const payment = database.prepare("SELECT * FROM payments WHERE id = 'payment-test'").get();
    assert.equal(payment?.status, "completed");
  } finally {
    database.close();
  }
});

test("wrong payment amount or currency leaves order and payment unchanged", () => {
  const { database } = setup();
  try {
    createPaymentAttempt(database, {
      id: "payment-test", orderId: "order-test", provider: "paypal", providerPaymentId: "PAYPAL-1",
      status: "CREATED", amountCents: 63200, currency: "USD", metadata: {}, now: 2000
    });
    assert.throws(() => applyPaymentResult(database, {
      provider: "paypal", providerPaymentId: "PAYPAL-1", status: "completed",
      amountCents: 1, currency: "USD", now: 3000
    }), /amount/);
    assert.throws(() => applyPaymentResult(database, {
      provider: "paypal", providerPaymentId: "PAYPAL-1", status: "completed",
      amountCents: 63200, currency: "EUR", now: 3000
    }), /currency/);
    assert.equal(getOrderByNumber(database, "BE-TEST-1")?.status, "PAYMENT_PROCESSING");
    assert.equal(database.prepare("SELECT status FROM payments WHERE id = 'payment-test'").get()?.status, "CREATED");
  } finally {
    database.close();
  }
});
