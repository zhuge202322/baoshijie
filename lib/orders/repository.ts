import { timingSafeEqual } from "node:crypto";
import type { CommerceDatabase } from "../db/client.ts";
import { hashLookupToken, type PaymentProvider } from "../checkout/create-order.ts";
import { assertOrderTransition, type OrderStatus } from "./transitions.ts";
import { optionalText } from "../validation/common.ts";

export type OrderRecord = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentProvider: PaymentProvider;
  currency: "USD";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingMethod: "standard" | "expedited";
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  customerNote: string;
  internalNote: string;
  providerReference: string;
  paidAt: number | null;
  createdAt: number;
  updatedAt: number;
};

function mapOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    status: String(row.status) as OrderStatus,
    paymentProvider: String(row.payment_provider) as PaymentProvider,
    currency: "USD",
    subtotalCents: Number(row.subtotal_cents),
    shippingCents: Number(row.shipping_cents),
    totalCents: Number(row.total_cents),
    shippingMethod: String(row.shipping_method) as OrderRecord["shippingMethod"],
    email: String(row.email),
    phone: String(row.phone),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    countryCode: String(row.country_code),
    region: String(row.region),
    city: String(row.city),
    postalCode: String(row.postal_code),
    addressLine1: String(row.address_line_1),
    addressLine2: String(row.address_line_2),
    customerNote: String(row.customer_note),
    internalNote: String(row.internal_note),
    providerReference: row.provider_reference ? String(row.provider_reference) : "",
    paidAt: row.paid_at === null || row.paid_at === undefined ? null : Number(row.paid_at),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

export function getOrderByNumber(database: CommerceDatabase, orderNumber: string) {
  const row = database.prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as Record<string, unknown> | undefined;
  return row ? mapOrder(row) : null;
}

export function getOrderById(database: CommerceDatabase, id: string) {
  const row = database.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapOrder(row) : null;
}

export function listOrders(
  database: CommerceDatabase,
  options: { status?: OrderStatus | ""; query?: string; limit?: number } = {}
) {
  const conditions: string[] = [];
  const parameters: Array<string | number> = [];
  if (options.status) {
    conditions.push("status = ?");
    parameters.push(options.status);
  }
  const query = options.query?.trim();
  if (query) {
    conditions.push("(order_number LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR provider_reference LIKE ?)");
    const pattern = `%${query}%`;
    parameters.push(pattern, pattern, pattern, pattern, pattern);
  }
  const limit = Math.max(1, Math.min(options.limit || 200, 500));
  parameters.push(limit);
  const rows = database.prepare(`
    SELECT * FROM orders ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY created_at DESC LIMIT ?
  `).all(...parameters) as Record<string, unknown>[];
  return rows.map(mapOrder);
}

export function getOrderDetail(database: CommerceDatabase, id: string) {
  const order = getOrderById(database, id);
  if (!order) return null;
  const items = (database.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at, id").all(id) as Record<string, unknown>[])
    .map((row) => ({
      id: String(row.id),
      productId: row.product_id ? String(row.product_id) : null,
      productSlug: String(row.product_slug),
      partNo: String(row.part_no),
      name: String(row.name),
      quantity: Number(row.quantity),
      unitPriceCents: Number(row.unit_price_cents),
      lineTotalCents: Number(row.line_total_cents)
    }));
  const payments = (database.prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY created_at, id").all(id) as Record<string, unknown>[])
    .map((row) => {
      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse(String(row.metadata_json)) as Record<string, unknown>; } catch {}
      return {
        id: String(row.id),
        provider: String(row.provider) as PaymentProvider,
        providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : "",
        status: String(row.status),
        amountCents: Number(row.amount_cents),
        currency: String(row.currency),
        metadata,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at)
      };
    });
  return { order, items, payments };
}

export function updateOrderInternalNote(database: CommerceDatabase, id: string, note: string) {
  const value = optionalText(note, "Internal note", 5000);
  const result = database.prepare("UPDATE orders SET internal_note = ?, updated_at = ? WHERE id = ?")
    .run(value, Date.now(), id);
  if (result.changes === 0) throw new Error("Order not found");
}

export function transitionOrderAsAdmin(database: CommerceDatabase, id: string, next: OrderStatus, now = Date.now()) {
  const order = getOrderById(database, id);
  if (!order) throw new Error("Order not found");
  assertOrderTransition(order.status, next, "admin");
  database.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(next, now, id);
}

function safeTextEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyOrderLookup(database: CommerceDatabase, orderNumber: string, lookupToken: string) {
  if (!orderNumber || !lookupToken) return null;
  const row = database.prepare("SELECT * FROM orders WHERE order_number = ?").get(orderNumber) as Record<string, unknown> | undefined;
  if (!row || !safeTextEqual(String(row.lookup_token_hash), hashLookupToken(lookupToken))) return null;
  return mapOrder(row);
}

export function getPrivateOrderStatus(database: CommerceDatabase, orderNumber: string, lookupToken: string) {
  const order = verifyOrderLookup(database, orderNumber, lookupToken);
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentProvider: order.paymentProvider,
    currency: order.currency,
    totalCents: order.totalCents,
    paidAt: order.paidAt,
    createdAt: order.createdAt
  };
}

export type PaymentAttemptInput = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  status: string;
  amountCents: number;
  currency: "USD";
  metadata: Record<string, unknown>;
  now?: number;
};

export function createPaymentAttempt(database: CommerceDatabase, input: PaymentAttemptInput) {
  const order = getOrderById(database, input.orderId);
  if (!order) throw new Error("Order not found");
  if (!["PENDING_PAYMENT", "PAYMENT_FAILED", "PAYMENT_PROCESSING"].includes(order.status)) {
    throw new Error("Order is not eligible for payment");
  }
  if (order.paymentProvider !== input.provider) throw new Error("Payment provider does not match order");
  if (order.totalCents !== input.amountCents) throw new Error("Payment amount does not match order");
  if (input.currency !== "USD") throw new Error("Payment currency does not match order");
  const now = input.now ?? Date.now();

  database.exec("BEGIN IMMEDIATE");
  try {
    const existing = database.prepare(
      "SELECT id, order_id, amount_cents, currency FROM payments WHERE provider = ? AND provider_payment_id = ?"
    ).get(input.provider, input.providerPaymentId);
    if (existing) {
      if (String(existing.order_id) !== input.orderId || Number(existing.amount_cents) !== input.amountCents || String(existing.currency) !== input.currency) {
        throw new Error("Provider payment ID is already associated with another payment");
      }
      database.prepare("UPDATE payments SET status = ?, metadata_json = ?, updated_at = ? WHERE id = ?")
        .run(input.status, JSON.stringify(input.metadata), now, String(existing.id));
    } else {
      database.prepare(`
        INSERT INTO payments (
          id, order_id, provider, provider_payment_id, status, amount_cents,
          currency, metadata_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.id,
        input.orderId,
        input.provider,
        input.providerPaymentId,
        input.status,
        input.amountCents,
        input.currency,
        JSON.stringify(input.metadata),
        now,
        now
      );
    }
    database.prepare("UPDATE orders SET status = 'PAYMENT_PROCESSING', provider_reference = ?, updated_at = ? WHERE id = ?")
      .run(input.providerPaymentId, now, input.orderId);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function markOrderPaymentProcessing(database: CommerceDatabase, id: string, provider: PaymentProvider, now = Date.now()) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const order = getOrderById(database, id);
    if (!order) throw new Error("Order not found");
    if (order.paymentProvider !== provider) throw new Error("Payment provider does not match order");
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED", "PAYMENT_PROCESSING"].includes(order.status)) {
      throw new Error("Order is not eligible for payment");
    }
    if (order.status !== "PAYMENT_PROCESSING") {
      assertOrderTransition(order.status, "PAYMENT_PROCESSING", "payment");
      database.prepare("UPDATE orders SET status = 'PAYMENT_PROCESSING', updated_at = ? WHERE id = ?").run(now, id);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getLatestPaymentAttempt(database: CommerceDatabase, orderId: string, provider: PaymentProvider) {
  const row = database.prepare(`
    SELECT * FROM payments WHERE order_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1
  `).get(orderId, provider) as Record<string, unknown> | undefined;
  if (!row) return null;
  let metadata: Record<string, unknown> = {};
  try { metadata = JSON.parse(String(row.metadata_json)) as Record<string, unknown>; } catch {}
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    provider: String(row.provider) as PaymentProvider,
    providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : "",
    status: String(row.status),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    metadata,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

export type PaymentResult = {
  provider: PaymentProvider;
  providerPaymentId: string;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  amountCents: number;
  currency: string;
  now?: number;
  metadata?: Record<string, unknown>;
};

const targetStatus: Record<PaymentResult["status"], OrderStatus> = {
  pending: "PAYMENT_PROCESSING",
  completed: "PAID",
  failed: "PAYMENT_FAILED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED"
};

export function applyPaymentResult(database: CommerceDatabase, input: PaymentResult) {
  const now = input.now ?? Date.now();
  database.exec("BEGIN IMMEDIATE");
  try {
    applyPaymentResultInTransaction(database, input, now);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function applyPaymentResultInTransaction(database: CommerceDatabase, input: PaymentResult, now = input.now ?? Date.now()) {
  const row = database.prepare(`
      SELECT p.id AS payment_id, p.amount_cents AS payment_amount, p.currency AS payment_currency,
             o.id AS order_id, o.status AS order_status, o.total_cents AS order_total
      FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE p.provider = ? AND p.provider_payment_id = ?
  `).get(input.provider, input.providerPaymentId) as Record<string, unknown> | undefined;
  if (!row) throw new Error("Payment attempt not found");
  if (input.amountCents !== Number(row.payment_amount) || input.amountCents !== Number(row.order_total)) {
    throw new Error("Payment amount does not match order");
  }
  if (input.currency !== "USD" || input.currency !== String(row.payment_currency)) {
    throw new Error("Payment currency does not match order");
  }

  const current = String(row.order_status) as OrderStatus;
  const next = targetStatus[input.status];
  const alreadyFulfilled = input.status === "completed" && ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(current);
  if (!alreadyFulfilled) assertOrderTransition(current, next, "payment");

  database.prepare("UPDATE payments SET status = ?, metadata_json = ?, updated_at = ? WHERE id = ?")
    .run(input.status, JSON.stringify(input.metadata || {}), now, String(row.payment_id));
  if (!alreadyFulfilled) {
    database.prepare(`
      UPDATE orders SET status = ?, paid_at = CASE WHEN ? = 'PAID' THEN COALESCE(paid_at, ?) ELSE paid_at END,
        provider_reference = ?, updated_at = ? WHERE id = ?
    `).run(next, next, now, input.providerPaymentId, now, String(row.order_id));
  }
}
