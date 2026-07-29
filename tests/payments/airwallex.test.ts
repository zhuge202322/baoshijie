import assert from "node:assert/strict";
import test from "node:test";
import { createAirwallexClient, PaymentProviderError } from "../../lib/payments/airwallex.ts";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

test("Airwallex authenticates and creates an auto-capture USD PaymentIntent", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) return jsonResponse({ token: "airwallex-token", expires_at: "2099-01-01T00:00:00Z" });
    return jsonResponse({ id: "int_123", client_secret: "secret_123", status: "REQUIRES_PAYMENT_METHOD", amount: 1252, currency: "USD" });
  };
  const client = createAirwallexClient({ clientId: "client-id", apiKey: "api-key", environment: "demo", fetchFn });
  const result = await client.createPaymentIntent({
    orderId: "order-id",
    orderNumber: "BE-1001",
    totalCents: 125200,
    idempotencyKey: "intent-key"
  });

  assert.equal(calls[0]?.url, "https://api-demo.airwallex.com/api/v1/authentication/login");
  const authHeaders = new Headers(calls[0]?.init?.headers);
  assert.equal(authHeaders.get("x-client-id"), "client-id");
  assert.equal(authHeaders.get("x-api-key"), "api-key");
  assert.equal(calls[1]?.url, "https://api-demo.airwallex.com/api/v1/pa/payment_intents/create");
  const headers = new Headers(calls[1]?.init?.headers);
  assert.equal(headers.get("x-idempotency-key"), "intent-key");
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), {
    request_id: "intent-key",
    amount: 1252,
    currency: "USD",
    merchant_order_id: "BE-1001",
    capture_method: "AUTOMATIC",
    metadata: { order_id: "order-id" }
  });
  assert.deepEqual(result, {
    paymentIntentId: "int_123",
    clientSecret: "secret_123",
    status: "REQUIRES_PAYMENT_METHOD",
    amountCents: 125200,
    currency: "USD"
  });
});

test("Airwallex rejects provider errors and invalid returned currency", async () => {
  let invalidCurrency = false;
  const fetchFn: typeof fetch = async (input) => {
    if (String(input).endsWith("/authentication/login")) return jsonResponse({ token: "token" });
    if (invalidCurrency) return jsonResponse({ id: "int_1", client_secret: "secret", status: "REQUIRES_PAYMENT_METHOD", amount: 10, currency: "EUR" });
    return jsonResponse({ code: "invalid_request", message: "Invalid amount" }, 400);
  };
  const client = createAirwallexClient({ clientId: "client", apiKey: "key", environment: "production", fetchFn });
  await assert.rejects(client.createPaymentIntent({ orderId: "o", orderNumber: "BE-1", totalCents: 1000, idempotencyKey: "key" }), (error: unknown) => {
    assert.ok(error instanceof PaymentProviderError);
    assert.equal(error.status, 400);
    return true;
  });
  invalidCurrency = true;
  await assert.rejects(client.createPaymentIntent({ orderId: "o", orderNumber: "BE-1", totalCents: 1000, idempotencyKey: "key-2" }), /currency/);
});

test("Airwallex requests time out", async () => {
  const fetchFn: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
  const client = createAirwallexClient({ clientId: "client", apiKey: "key", environment: "demo", fetchFn, timeoutMs: 10 });
  await assert.rejects(client.createPaymentIntent({ orderId: "o", orderNumber: "BE-1", totalCents: 100, idempotencyKey: "key" }), /timed out/);
});
