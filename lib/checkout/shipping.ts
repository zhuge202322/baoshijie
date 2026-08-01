import type { CommerceDatabase } from "../db/client.ts";

export type ShippingMethod = "standard" | "expedited";
export type ShippingRates = Record<ShippingMethod, number>;

export const defaultShippingRates: ShippingRates = {
  standard: 1200,
  expedited: 4500
};

function validateRate(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} shipping price must use non-negative integer cents`);
  }
  return value;
}

export function getShippingRates(database: CommerceDatabase): ShippingRates {
  const rows = database
    .prepare("SELECT method, price_cents FROM shipping_rates")
    .all() as Array<{ method: string; price_cents: number }>;
  const rates = new Map(rows.map((row) => [row.method, Number(row.price_cents)]));
  if (!rates.has("standard") || !rates.has("expedited")) {
    throw new Error("Shipping rates are not initialized");
  }
  return {
    standard: validateRate(Number(rates.get("standard")), "Standard"),
    expedited: validateRate(Number(rates.get("expedited")), "Expedited")
  };
}

export function updateShippingRates(database: CommerceDatabase, input: ShippingRates) {
  const rates: ShippingRates = {
    standard: validateRate(input.standard, "Standard"),
    expedited: validateRate(input.expedited, "Expedited")
  };
  const statement = database.prepare(`
    INSERT INTO shipping_rates (method, price_cents, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(method) DO UPDATE SET price_cents = excluded.price_cents, updated_at = excluded.updated_at
  `);
  const now = Date.now();
  database.exec("BEGIN IMMEDIATE");
  try {
    statement.run("standard", rates.standard, now);
    statement.run("expedited", rates.expedited, now);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
  return rates;
}
