import assert from "node:assert/strict";
import test from "node:test";
import { assertOrderTransition, canTransitionOrder } from "../../lib/orders/transitions.ts";

test("payment actors control payment statuses", () => {
  assert.equal(canTransitionOrder("PENDING_PAYMENT", "PAYMENT_PROCESSING", "payment"), true);
  assert.equal(canTransitionOrder("PAYMENT_PROCESSING", "PAID", "payment"), true);
  assert.equal(canTransitionOrder("PENDING_PAYMENT", "PAID", "payment"), true);
  assert.equal(canTransitionOrder("PAID", "REFUNDED", "payment"), true);
  assert.equal(canTransitionOrder("PAID", "PROCESSING", "payment"), false);
});

test("administrators control fulfillment but cannot mark an order paid or refunded", () => {
  assert.equal(canTransitionOrder("PAID", "CONFIRMED", "admin"), true);
  assert.equal(canTransitionOrder("CONFIRMED", "PROCESSING", "admin"), true);
  assert.equal(canTransitionOrder("PROCESSING", "SHIPPED", "admin"), true);
  assert.equal(canTransitionOrder("PENDING_PAYMENT", "CANCELLED", "admin"), true);
  assert.equal(canTransitionOrder("PENDING_PAYMENT", "PAID", "admin"), false);
  assert.equal(canTransitionOrder("SHIPPED", "REFUNDED", "admin"), false);
});

test("illegal and backwards transitions are rejected", () => {
  assert.equal(canTransitionOrder("SHIPPED", "PROCESSING", "admin"), false);
  assert.equal(canTransitionOrder("CANCELLED", "PAID", "payment"), false);
  assert.throws(() => assertOrderTransition("PAID", "SHIPPED", "admin"), /not allowed/);
});
