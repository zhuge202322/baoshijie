import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { CommerceDatabase } from "../db/client.ts";
import { getProductBySlug } from "../catalog/repository.ts";
import { optionalText, requireText } from "../validation/common.ts";
import { getShippingRates } from "./shipping.ts";
import {
  calculateCheckoutTotals,
  isSupportedDestination,
  validateCartLines,
  type ShippingMethod
} from "./policy.ts";

export type PaymentProvider = "paypal" | "airwallex";

export type GuestCustomerInput = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  customerNote?: string;
};

export type GuestOrderInput = {
  lines: Array<{ slug: string; quantity: number; clientPriceCents?: unknown }>;
  shippingMethod: ShippingMethod;
  paymentProvider: PaymentProvider;
  customer: GuestCustomerInput;
};

type CreationOptions = {
  now?: number;
  orderId?: string;
  itemId?: (index: number) => string;
  orderNumber?: string;
  lookupToken?: string;
};

function normalizeCustomer(input: GuestCustomerInput) {
  const email = requireText(input?.email, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid email is required");
  const countryCode = requireText(input?.countryCode, "Destination", 2).toUpperCase();
  if (!isSupportedDestination(countryCode)) throw new Error("This shipping destination is not supported");
  const region = optionalText(input?.region, "State or province", 120);
  if ((countryCode === "US" || countryCode === "CA") && !region) {
    throw new Error("State or province is required for this destination");
  }
  return {
    email,
    phone: requireText(input?.phone, "Phone", 80),
    firstName: requireText(input?.firstName, "First name", 100),
    lastName: requireText(input?.lastName, "Last name", 100),
    countryCode,
    region,
    city: requireText(input?.city, "City", 120),
    postalCode: requireText(input?.postalCode, "Postal code", 40),
    addressLine1: requireText(input?.addressLine1, "Address", 200),
    addressLine2: optionalText(input?.addressLine2, "Address line 2", 200),
    customerNote: optionalText(input?.customerNote, "Customer note", 2000)
  };
}

function defaultOrderNumber(now: number) {
  const date = new Date(now).toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `BE-${date}-${suffix}`;
}

export function hashLookupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createGuestOrder(database: CommerceDatabase, input: GuestOrderInput, options: CreationOptions = {}) {
  const lines = validateCartLines(input?.lines);
  const customer = normalizeCustomer(input?.customer);
  if (input.paymentProvider !== "paypal" && input.paymentProvider !== "airwallex") {
    throw new Error("Invalid payment provider");
  }

  const products = lines.map((line) => {
    const product = getProductBySlug(database, line.slug);
    if (!product || product.inventoryStatus === "unavailable") {
      throw new Error(`Product ${line.slug} is not available`);
    }
    return { product, quantity: line.quantity, lineTotalCents: product.priceCents * line.quantity };
  });
  const totals = calculateCheckoutTotals(
    products.map((item) => item.lineTotalCents),
    input.shippingMethod,
    getShippingRates(database)
  );
  const now = options.now ?? Date.now();
  const orderId = options.orderId || `order-${randomUUID()}`;
  const orderNumber = options.orderNumber || defaultOrderNumber(now);
  const lookupToken = options.lookupToken || randomBytes(32).toString("base64url");

  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare(`
      INSERT INTO orders (
        id, order_number, lookup_token_hash, status, payment_provider, currency,
        subtotal_cents, shipping_cents, total_cents, shipping_method,
        email, phone, first_name, last_name, country_code, region, city, postal_code,
        address_line_1, address_line_2, customer_note, created_at, updated_at
      ) VALUES (?, ?, ?, 'PENDING_PAYMENT', ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      orderNumber,
      hashLookupToken(lookupToken),
      input.paymentProvider,
      totals.subtotalCents,
      totals.shippingCents,
      totals.totalCents,
      input.shippingMethod,
      customer.email,
      customer.phone,
      customer.firstName,
      customer.lastName,
      customer.countryCode,
      customer.region,
      customer.city,
      customer.postalCode,
      customer.addressLine1,
      customer.addressLine2,
      customer.customerNote,
      now,
      now
    );

    const insertItem = database.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_slug, part_no, name, quantity,
        unit_price_cents, line_total_cents, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    products.forEach(({ product, quantity, lineTotalCents }, index) => {
      insertItem.run(
        options.itemId?.(index) || `item-${randomUUID()}`,
        orderId,
        product.id,
        product.slug,
        product.partNo,
        product.name,
        quantity,
        product.priceCents,
        lineTotalCents,
        now
      );
    });
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return {
    id: orderId,
    orderNumber,
    lookupToken,
    status: "PENDING_PAYMENT" as const,
    paymentProvider: input.paymentProvider,
    totals
  };
}
