import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createGuestOrder } from "../../lib/checkout/create-order.ts";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import { applyPaymentResult, createPaymentAttempt } from "../../lib/orders/repository.ts";
import { createSessionToken } from "../../lib/auth/session.ts";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";
const databasePath = process.env.TEST_DATABASE_PATH || "D:/kehu/baoshijie/storage/admin-browser-test.sqlite";
const username = process.env.ADMIN_USERNAME || "owner";
const secret = process.env.SESSION_SECRET || "test-session-secret-with-at-least-thirty-two-characters";

test("administrator can search a paid order, save a note, and advance fulfillment", async () => {
  const database = createDatabase(databasePath);
  migrateDatabase(database);
  seedDatabase(database);
  database.prepare("DELETE FROM orders WHERE id = ?").run("browser-admin-order");
  createGuestOrder(database, {
    lines: [{ slug: "precision-short-shifter", quantity: 1 }], shippingMethod: "standard", paymentProvider: "paypal",
    customer: { email: "admin-order@example.com", phone: "1", firstName: "Browser", lastName: "Customer", countryCode: "US", region: "CA", city: "LA", postalCode: "90001", addressLine1: "1 Main" }
  }, { orderId: "browser-admin-order", orderNumber: "BE-BROWSER-ORDER", lookupToken: "token", now: Date.now() });
  createPaymentAttempt(database, {
    id: "browser-admin-payment", orderId: "browser-admin-order", provider: "paypal", providerPaymentId: "PAYPAL-BROWSER-ORDER",
    status: "CREATED", amountCents: 63200, currency: "USD", metadata: {}, now: Date.now()
  });
  applyPaymentResult(database, {
    provider: "paypal", providerPaymentId: "PAYPAL-BROWSER-ORDER", status: "completed", amountCents: 63200, currency: "USD", now: Date.now()
  });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([{ name: "baoshijie_admin", value: createSessionToken(username, secret), url: baseUrl, httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/admin/orders?query=admin-order%40example.com`);
    await page.getByRole("link", { name: "BE-BROWSER-ORDER" }).click();
    await page.getByText("PAYPAL-BROWSER-ORDER").waitFor();
    await page.getByLabel("Note").fill("Browser-confirmed fitment.");
    await page.getByRole("button", { name: "Save note" }).click();
    await page.getByText("Internal note updated.").waitFor();
    await page.getByRole("button", { name: /Mark confirmed/i }).click();
    await page.getByText("Order status updated.").waitFor();
    assert.equal(await page.locator(".admin-page-header .admin-status").textContent(), "CONFIRMED");
  } finally {
    database.prepare("DELETE FROM orders WHERE id = ?").run("browser-admin-order");
    database.close();
    await browser.close();
  }
});
