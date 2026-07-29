import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { CommerceDatabase } from "../db/client.ts";
import { applyPaymentResultInTransaction, type PaymentResult } from "../orders/repository.ts";

export type NormalizedPaymentEvent = Omit<PaymentResult, "now" | "metadata"> & {
  eventId: string;
  eventType: string;
};

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyAirwallexSignature(rawBody: string, timestamp: string, signature: string, secret: string, now = Date.now()) {
  if (!secret || !/^\d{10,13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const timestampNumber = Number(timestamp);
  const timestampMs = timestamp.length === 10 ? timestampNumber * 1000 : timestampNumber;
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}${rawBody}`).digest("hex");
  return safeEqual(expected.toLowerCase(), signature.toLowerCase());
}

function paypalCents(value: unknown) {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) throw new Error("PayPal webhook amount is invalid");
  const [dollars, fraction] = value.split(".");
  const cents = Number(dollars) * 100 + Number(fraction);
  if (!Number.isSafeInteger(cents)) throw new Error("PayPal webhook amount is invalid");
  return cents;
}

export function normalizePayPalEvent(payload: Record<string, unknown>): NormalizedPaymentEvent | null {
  const eventId = typeof payload.id === "string" ? payload.id : "";
  const eventType = typeof payload.event_type === "string" ? payload.event_type : "";
  const statuses: Record<string, PaymentResult["status"]> = {
    "PAYMENT.CAPTURE.PENDING": "pending",
    "PAYMENT.CAPTURE.COMPLETED": "completed",
    "PAYMENT.CAPTURE.DENIED": "failed",
    "PAYMENT.CAPTURE.DECLINED": "failed",
    "PAYMENT.CAPTURE.REFUNDED": "refunded",
    "PAYMENT.CAPTURE.REVERSED": "refunded"
  };
  const status = statuses[eventType];
  if (!eventId || !eventType || !status) return null;
  const resource = payload.resource as Record<string, unknown> | undefined;
  const amount = resource?.amount as Record<string, unknown> | undefined;
  const supplementary = resource?.supplementary_data as Record<string, unknown> | undefined;
  const related = supplementary?.related_ids as Record<string, unknown> | undefined;
  const providerPaymentId = typeof related?.order_id === "string" ? related.order_id : "";
  if (!providerPaymentId) throw new Error("PayPal webhook order ID is missing");
  return {
    provider: "paypal",
    eventId,
    eventType,
    providerPaymentId,
    status,
    amountCents: paypalCents(amount?.value),
    currency: String(amount?.currency_code || "")
  };
}

export function normalizeAirwallexEvent(payload: Record<string, unknown>): NormalizedPaymentEvent | null {
  const eventId = typeof payload.id === "string" ? payload.id : "";
  const eventType = typeof payload.name === "string" ? payload.name : "";
  const statuses: Record<string, PaymentResult["status"]> = {
    "payment_intent.requires_capture": "pending",
    "payment_intent.succeeded": "completed",
    "payment_intent.payment_failed": "failed",
    "payment_intent.cancelled": "cancelled",
    "payment_intent.refunded": "refunded"
  };
  const status = statuses[eventType];
  if (!eventId || !eventType || !status) return null;
  const data = payload.data as Record<string, unknown> | undefined;
  const object = data?.object as Record<string, unknown> | undefined;
  if (!object || typeof object.id !== "string" || typeof object.amount !== "number") {
    throw new Error("Airwallex webhook payment data is invalid");
  }
  const amountCents = Math.round(object.amount * 100);
  if (!Number.isSafeInteger(amountCents) || Math.abs(amountCents / 100 - object.amount) > 0.000001) {
    throw new Error("Airwallex webhook amount is invalid");
  }
  return {
    provider: "airwallex",
    eventId,
    eventType,
    providerPaymentId: object.id,
    status,
    amountCents,
    currency: String(object.currency || "")
  };
}

function payloadHash(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function processVerifiedPaymentEvent(
  database: CommerceDatabase,
  event: NormalizedPaymentEvent,
  rawBody: string,
  now = Date.now()
): "processed" | "duplicate" {
  const hash = payloadHash(rawBody);
  database.exec("BEGIN IMMEDIATE");
  try {
    const existing = database.prepare(
      "SELECT payload_hash, processing_status FROM webhook_events WHERE provider = ? AND provider_event_id = ?"
    ).get(event.provider, event.eventId);
    if (existing && String(existing.payload_hash) !== hash) throw new Error("Webhook event payload does not match the original payload");
    if (existing?.processing_status === "processed" || existing?.processing_status === "ignored") {
      database.exec("COMMIT");
      return "duplicate";
    }
    if (!existing) {
      database.prepare(`
        INSERT INTO webhook_events (
          id, provider, provider_event_id, event_type, payload_hash, processing_status, received_at
        ) VALUES (?, ?, ?, ?, ?, 'received', ?)
      `).run(`webhook-${randomUUID()}`, event.provider, event.eventId, event.eventType, hash, now);
    }
    applyPaymentResultInTransaction(database, { ...event, metadata: { eventId: event.eventId, eventType: event.eventType } }, now);
    database.prepare(`
      UPDATE webhook_events SET processing_status = 'processed', error_message = '', processed_at = ?
      WHERE provider = ? AND provider_event_id = ?
    `).run(now, event.provider, event.eventId);
    database.exec("COMMIT");
    return "processed";
  } catch (error) {
    database.exec("ROLLBACK");
    const existing = database.prepare(
      "SELECT payload_hash, processing_status FROM webhook_events WHERE provider = ? AND provider_event_id = ?"
    ).get(event.provider, event.eventId);
    if (!existing) {
      database.prepare(`
        INSERT INTO webhook_events (
          id, provider, provider_event_id, event_type, payload_hash, processing_status,
          error_message, received_at, processed_at
        ) VALUES (?, ?, ?, ?, ?, 'failed', ?, ?, ?)
      `).run(
        `webhook-${randomUUID()}`, event.provider, event.eventId, event.eventType, hash,
        error instanceof Error ? error.message.slice(0, 1000) : "Webhook processing failed", now, now
      );
    } else if (String(existing.payload_hash) === hash && existing.processing_status !== "processed") {
      database.prepare(`
        UPDATE webhook_events SET processing_status = 'failed', error_message = ?, processed_at = ?
        WHERE provider = ? AND provider_event_id = ?
      `).run(error instanceof Error ? error.message.slice(0, 1000) : "Webhook processing failed", now, event.provider, event.eventId);
    }
    throw error;
  }
}

export function recordIgnoredWebhookEvent(
  database: CommerceDatabase,
  provider: "paypal" | "airwallex",
  eventId: string,
  eventType: string,
  rawBody: string,
  now = Date.now()
) {
  database.prepare(`
    INSERT INTO webhook_events (
      id, provider, provider_event_id, event_type, payload_hash, processing_status, received_at, processed_at
    ) VALUES (?, ?, ?, ?, ?, 'ignored', ?, ?)
    ON CONFLICT(provider, provider_event_id) DO NOTHING
  `).run(`webhook-${randomUUID()}`, provider, eventId, eventType, payloadHash(rawBody), now, now);
}
