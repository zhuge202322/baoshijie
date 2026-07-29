import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createGuestOrder } from "../../lib/checkout/create-order.ts";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { createPaymentAttempt, getOrderByNumber } from "../../lib/orders/repository.ts";
import {
  normalizeAirwallexEvent,
  normalizePayPalEvent,
  processVerifiedPaymentEvent,
  verifyAirwallexSignature
} from "../../lib/payments/webhooks.ts";

const rawBody = JSON.stringify({ id: "evt_1", name: "payment_intent.succeeded" });

test("Airwallex signatures validate raw bytes and reject stale or altered requests", () => {
  const secret = "webhook-secret";
  const now = 1_800_000_000_000;
  const timestamp = String(now);
  const signature = createHmac("sha256", secret).update(`${timestamp}${rawBody}`).digest("hex");
  assert.equal(verifyAirwallexSignature(rawBody, timestamp, signature, secret, now), true);
  assert.equal(verifyAirwallexSignature(`${rawBody} `, timestamp, signature, secret, now), false);
  assert.equal(verifyAirwallexSignature(rawBody, String(now - 301_000), signature, secret, now), false);
  assert.equal(verifyAirwallexSignature(rawBody, timestamp, "00", secret, now), false);
});

test("provider event payloads normalize payment ID, amount, currency, and outcome", () => {
  assert.deepEqual(normalizePayPalEvent({
    id: "WH-1",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      amount: { currency_code: "USD", value: "632.00" },
      supplementary_data: { related_ids: { order_id: "PAYPAL-1" } }
    }
  }), {
    provider: "paypal", eventId: "WH-1", eventType: "PAYMENT.CAPTURE.COMPLETED",
    providerPaymentId: "PAYPAL-1", status: "completed", amountCents: 63200, currency: "USD"
  });
  assert.deepEqual(normalizeAirwallexEvent({
    id: "evt_1",
    name: "payment_intent.succeeded",
    data: { object: { id: "int_1", amount: 632, currency: "USD" } }
  }), {
    provider: "airwallex", eventId: "evt_1", eventType: "payment_intent.succeeded",
    providerPaymentId: "int_1", status: "completed", amountCents: 63200, currency: "USD"
  });
});

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  createGuestOrder(database, {
    lines: [{ slug: "precision-short-shifter", quantity: 1 }], shippingMethod: "standard", paymentProvider: "paypal",
    customer: { email: "driver@example.com", phone: "1", firstName: "Test", lastName: "Driver", countryCode: "US", region: "CA", city: "LA", postalCode: "90001", addressLine1: "1 Main" }
  }, { orderId: "order-test", orderNumber: "BE-TEST", lookupToken: "token", now: 1000 });
  createPaymentAttempt(database, {
    id: "payment-test", orderId: "order-test", provider: "paypal", providerPaymentId: "PAYPAL-1",
    status: "CREATED", amountCents: 63200, currency: "USD", metadata: {}, now: 2000
  });
  return database;
}

test("verified webhook events apply once and duplicate IDs are idempotent", () => {
  const database = setup();
  const event = {
    provider: "paypal" as const, eventId: "WH-1", eventType: "PAYMENT.CAPTURE.COMPLETED",
    providerPaymentId: "PAYPAL-1", status: "completed" as const, amountCents: 63200, currency: "USD"
  };
  try {
    assert.equal(processVerifiedPaymentEvent(database, event, rawBody, 3000), "processed");
    assert.equal(processVerifiedPaymentEvent(database, event, rawBody, 4000), "duplicate");
    assert.equal(getOrderByNumber(database, "BE-TEST")?.status, "PAID");
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM webhook_events").get()?.count, 1);
    assert.throws(() => processVerifiedPaymentEvent(database, event, `${rawBody} altered`, 5000), /payload/);
  } finally {
    database.close();
  }
});

test("wrong webhook amount records failure without mutating the order", () => {
  const database = setup();
  try {
    assert.throws(() => processVerifiedPaymentEvent(database, {
      provider: "paypal", eventId: "WH-BAD", eventType: "PAYMENT.CAPTURE.COMPLETED",
      providerPaymentId: "PAYPAL-1", status: "completed", amountCents: 1, currency: "USD"
    }, rawBody, 3000), /amount/);
    assert.equal(getOrderByNumber(database, "BE-TEST")?.status, "PAYMENT_PROCESSING");
    assert.equal(database.prepare("SELECT processing_status FROM webhook_events WHERE provider_event_id = 'WH-BAD'").get()?.processing_status, "failed");
  } finally {
    database.close();
  }
});
