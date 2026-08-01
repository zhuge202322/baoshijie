import { checkoutCountries, type CheckoutCountryCode } from "./countries.ts";
import { defaultShippingRates, type ShippingMethod, type ShippingRates } from "./shipping.ts";

export type { ShippingMethod } from "./shipping.ts";
export type CheckoutLine = { slug: string; quantity: number };

const supportedCountryCodes = new Set<string>(checkoutCountries.map((country) => country.code));

export function isSupportedDestination(value: string): value is CheckoutCountryCode {
  return supportedCountryCodes.has(value);
}

export function getShippingCents(method: string, rates: ShippingRates = defaultShippingRates) {
  if (method !== "standard" && method !== "expedited") throw new Error("Invalid shipping method");
  const shippingCents = rates[method as ShippingMethod];
  if (!Number.isSafeInteger(shippingCents) || shippingCents < 0) {
    throw new Error("Shipping price must use non-negative integer cents");
  }
  return shippingCents;
}

export function calculateCheckoutTotals(
  lineTotalsCents: number[],
  shippingMethod: string,
  shippingRates: ShippingRates = defaultShippingRates
) {
  if (lineTotalsCents.some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Checkout prices must use non-negative integer cents");
  }
  const subtotalCents = lineTotalsCents.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(subtotalCents)) throw new Error("Checkout total is too large");
  const shippingCents = getShippingCents(shippingMethod, shippingRates);
  return {
    currency: "USD" as const,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents
  };
}

export function validateCartLines(value: unknown): CheckoutLine[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Cart is empty");
  if (value.length > 50) throw new Error("Cart contains too many products");
  const seen = new Set<string>();
  return value.map((line) => {
    if (!line || typeof line !== "object") throw new Error("Invalid cart line");
    const slug = "slug" in line && typeof line.slug === "string" ? line.slug.trim() : "";
    const quantity = "quantity" in line ? line.quantity : undefined;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Cart line requires a valid product slug");
    if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 9) {
      throw new Error("Cart quantity must be between 1 and 9");
    }
    if (seen.has(slug)) throw new Error("Cart contains a duplicate product");
    seen.add(slug);
    return { slug, quantity: Number(quantity) };
  });
}
