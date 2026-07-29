import assert from "node:assert/strict";
import test from "node:test";
import { classifyOrderResult, shouldClearCartForOrder } from "../../lib/orders/result.ts";

test("order result classification keeps pending, failed, paid, cancelled, and refunded states distinct", () => {
  assert.equal(classifyOrderResult("PENDING_PAYMENT"), "pending");
  assert.equal(classifyOrderResult("PAYMENT_PROCESSING"), "pending");
  assert.equal(classifyOrderResult("PAYMENT_FAILED"), "failed");
  assert.equal(classifyOrderResult("PAID"), "success");
  assert.equal(classifyOrderResult("CONFIRMED"), "success");
  assert.equal(classifyOrderResult("PROCESSING"), "success");
  assert.equal(classifyOrderResult("SHIPPED"), "success");
  assert.equal(classifyOrderResult("CANCELLED"), "cancelled");
  assert.equal(classifyOrderResult("REFUNDED"), "refunded");
});

test("cart clearing is only allowed after payment is authoritative", () => {
  assert.equal(shouldClearCartForOrder("PENDING_PAYMENT"), false);
  assert.equal(shouldClearCartForOrder("PAYMENT_FAILED"), false);
  assert.equal(shouldClearCartForOrder("PAID"), true);
  assert.equal(shouldClearCartForOrder("CONFIRMED"), true);
  assert.equal(shouldClearCartForOrder("SHIPPED"), true);
  assert.equal(shouldClearCartForOrder("REFUNDED"), true);
});
