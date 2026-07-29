import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";

test("guest checkout exposes supported destinations, fixed shipping, and hosted payment choices", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/checkout`);
    await page.getByRole("heading", { name: "Your cart is empty" }).waitFor();

    await page.goto(`${baseUrl}/catalog`);
    await page.getByRole("button", { name: "Add", exact: true }).first().click();
    await page.goto(`${baseUrl}/checkout`);

    const countries = page.getByLabel("Country or region");
    await countries.waitFor();
    assert.equal(await countries.locator("option").count(), 35);
    const standard = page.locator("label", { hasText: "Standard Shipping" });
    const expedited = page.locator("label", { hasText: "Premium Expedited Air" });
    await standard.getByText("$12.00").waitFor();
    await expedited.getByText("$45.00").waitFor();
    assert.equal(await page.getByText(/tax/i).count(), 0);

    assert.equal(await page.getByLabel("PayPal").isDisabled(), true);
    assert.equal(await page.getByLabel("Credit or debit card via Airwallex").isDisabled(), true);
    assert.equal(await page.getByLabel(/card number/i).count(), 0);
    assert.equal(await page.getByLabel(/cvc/i).count(), 0);
  } finally {
    await browser.close();
  }
});
