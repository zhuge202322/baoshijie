import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createSessionToken } from "../../lib/auth/session.ts";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3010";
const username = process.env.ADMIN_USERNAME || "owner";
const sessionSecret = process.env.SESSION_SECRET || "test-session-secret-with-at-least-thirty-two-characters";

test("admin routes redirect guests and render for a signed-in administrator", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const guestPage = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await guestPage.goto(`${baseUrl}/admin`);
    assert.match(guestPage.url(), /\/admin\/login$/);

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([{
      name: "baoshijie_admin",
      value: createSessionToken(username, sessionSecret),
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax"
    }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/admin`);
    await page.getByRole("heading", { name: "Dashboard" }).waitFor();
    assert.equal(await page.locator(".admin-shell").count(), 1);
    assert.equal(await page.locator(".nav-bar").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Sign out" }).count(), 1);
  } finally {
    await browser.close();
  }
});
