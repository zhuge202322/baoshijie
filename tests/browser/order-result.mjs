import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createGuestOrder } from "../../lib/checkout/create-order.ts";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { applyPaymentResult, createPaymentAttempt } from "../../lib/orders/repository.ts";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";
const databasePath = process.env.TEST_DATABASE_PATH || "D:/kehu/baoshijie/storage/admin-browser-test.sqlite";
const cart = JSON.stringify([{ slug: "precision-short-shifter", quantity: 1 }]);

function createOrder(database, id, number, token) {
  return createGuestOrder(database, {
    lines: [{ slug: "precision-short-shifter", quantity: 1 }], shippingMethod: "standard", paymentProvider: "paypal",
    customer: { email: "result@example.com", phone: "1", firstName: "Result", lastName: "Test", countryCode: "US", region: "CA", city: "LA", postalCode: "90001", addressLine1: "1 Main" }
  }, { orderId: id, orderNumber: number, lookupToken: token, now: Date.now() });
}

test("authoritative paid results clear the cart while pending results preserve it", async () => {
  const database = createDatabase(databasePath);
  migrateDatabase(database);
  seedDatabase(database);
  database.prepare("DELETE FROM orders WHERE id IN (?, ?)").run("browser-paid-order", "browser-pending-order");
  createOrder(database, "browser-paid-order", "BE-BROWSER-PAID", "paid-token");
  createPaymentAttempt(database, {
    id: "browser-paid-payment", orderId: "browser-paid-order", provider: "paypal", providerPaymentId: "PAYPAL-BROWSER-PAID",
    status: "CREATED", amountCents: 63200, currency: "USD", metadata: {}, now: Date.now()
  });
  applyPaymentResult(database, {
    provider: "paypal", providerPaymentId: "PAYPAL-BROWSER-PAID", status: "completed", amountCents: 63200, currency: "USD", now: Date.now()
  });
  createOrder(database, "browser-pending-order", "BE-BROWSER-PENDING", "pending-token");

  const browser = await chromium.launch({ headless: true });
  try {
    const paidContext = await browser.newContext();
    await paidContext.addInitScript((value) => localStorage.setItem("carbonforge-cart", value), cart);
    const paidPage = await paidContext.newPage();
    await paidPage.goto(`${baseUrl}/checkout/result?order=BE-BROWSER-PAID&token=paid-token`);
    await paidPage.getByRole("heading", { name: "Payment received" }).waitFor();
    await paidPage.waitForFunction(() => localStorage.getItem("carbonforge-cart") === "[]");

    const pendingContext = await browser.newContext();
    await pendingContext.addInitScript((value) => localStorage.setItem("carbonforge-cart", value), cart);
    const pendingPage = await pendingContext.newPage();
    await pendingPage.goto(`${baseUrl}/checkout/result?order=BE-BROWSER-PENDING&token=pending-token`);
    await pendingPage.getByRole("heading", { name: "Payment processing" }).waitFor();
    assert.equal(await pendingPage.evaluate(() => localStorage.getItem("carbonforge-cart")), cart);
  } finally {
    database.prepare("DELETE FROM orders WHERE id IN (?, ?)").run("browser-paid-order", "browser-pending-order");
    database.close();
    await browser.close();
  }
});
