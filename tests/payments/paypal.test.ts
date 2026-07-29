import assert from "node:assert/strict";
import test from "node:test";
import { createPayPalClient, PaymentProviderError } from "../../lib/payments/paypal.ts";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

test("PayPal gets OAuth and creates a USD capture order with an idempotency key", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) return jsonResponse({ access_token: "access-token", expires_in: 3600 });
    return jsonResponse({ id: "PAYPAL-ORDER-1", status: "CREATED", links: [{ rel: "approve", href: "https://paypal.test/approve" }] });
  };
  const client = createPayPalClient({ clientId: "client", clientSecret: "secret", environment: "sandbox", fetchFn });
  const result = await client.createOrder({
    orderId: "order-id",
    orderNumber: "BE-1001",
    totalCents: 125200,
    idempotencyKey: "create-order-id"
  });

  assert.equal(calls[0]?.url, "https://api-m.sandbox.paypal.com/v1/oauth2/token");
  assert.equal(calls[0]?.init?.headers && new Headers(calls[0].init.headers).get("authorization"), `Basic ${Buffer.from("client:secret").toString("base64")}`);
  assert.equal(calls[1]?.url, "https://api-m.sandbox.paypal.com/v2/checkout/orders");
  const headers = new Headers(calls[1]?.init?.headers);
  assert.equal(headers.get("paypal-request-id"), "create-order-id");
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: "order-id",
      custom_id: "BE-1001",
      amount: { currency_code: "USD", value: "1252.00" }
    }]
  });
  assert.deepEqual(result, { providerOrderId: "PAYPAL-ORDER-1", status: "CREATED", approvalUrl: "https://paypal.test/approve" });
});

test("PayPal capture maps completed and pending outcomes", async () => {
  let captureStatus = "COMPLETED";
  const fetchFn: typeof fetch = async (input) => {
    if (String(input).endsWith("/v1/oauth2/token")) return jsonResponse({ access_token: "token" });
    return jsonResponse({
      id: "PAYPAL-ORDER-1",
      status: captureStatus,
      purchase_units: [{ payments: { captures: [{ id: "CAPTURE-1", status: captureStatus, amount: { currency_code: "USD", value: "1252.00" } }] } }]
    });
  };
  const client = createPayPalClient({ clientId: "client", clientSecret: "secret", environment: "live", fetchFn });
  assert.deepEqual(await client.captureOrder("PAYPAL-ORDER-1", "capture-key"), {
    providerOrderId: "PAYPAL-ORDER-1",
    captureId: "CAPTURE-1",
    status: "completed",
    amountCents: 125200,
    currency: "USD"
  });
  captureStatus = "PENDING";
  assert.equal((await client.captureOrder("PAYPAL-ORDER-1", "capture-key-2")).status, "pending");
});

test("PayPal surfaces provider errors without leaking credentials", async () => {
  const fetchFn: typeof fetch = async (input) => {
    if (String(input).endsWith("/v1/oauth2/token")) return jsonResponse({ access_token: "token" });
    return jsonResponse({ name: "UNPROCESSABLE_ENTITY", message: "Amount invalid" }, 422);
  };
  const client = createPayPalClient({ clientId: "client", clientSecret: "super-secret", environment: "sandbox", fetchFn });
  await assert.rejects(client.createOrder({ orderId: "o", orderNumber: "BE-1", totalCents: 100, idempotencyKey: "key" }), (error: unknown) => {
    assert.ok(error instanceof PaymentProviderError);
    assert.equal(error.status, 422);
    assert.equal(error.message.includes("super-secret"), false);
    return true;
  });
});

test("PayPal requests time out", async () => {
  const fetchFn: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
  const client = createPayPalClient({ clientId: "client", clientSecret: "secret", environment: "sandbox", fetchFn, timeoutMs: 10 });
  await assert.rejects(client.createOrder({ orderId: "o", orderNumber: "BE-1", totalCents: 100, idempotencyKey: "key" }), /timed out/);
});

test("PayPal webhook verification maps transmission headers to the official verification API", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchFn: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    if (calls.length === 1) return jsonResponse({ access_token: "token" });
    return jsonResponse({ verification_status: "SUCCESS" });
  };
  const client = createPayPalClient({ clientId: "client", clientSecret: "secret", environment: "sandbox", fetchFn });
  const event = { id: "WH-1", event_type: "PAYMENT.CAPTURE.COMPLETED" };
  const valid = await client.verifyWebhookSignature({
    webhookId: "WEBHOOK-ID",
    transmissionId: "transmission-id",
    transmissionTime: "2026-07-29T10:00:00Z",
    transmissionSignature: "signature",
    certUrl: "https://api.paypal.com/cert.pem",
    authAlgorithm: "SHA256withRSA",
    webhookEvent: event
  });
  assert.equal(valid, true);
  assert.equal(calls[1]?.url, "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature");
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), {
    auth_algo: "SHA256withRSA",
    cert_url: "https://api.paypal.com/cert.pem",
    transmission_id: "transmission-id",
    transmission_sig: "signature",
    transmission_time: "2026-07-29T10:00:00Z",
    webhook_id: "WEBHOOK-ID",
    webhook_event: event
  });
});
