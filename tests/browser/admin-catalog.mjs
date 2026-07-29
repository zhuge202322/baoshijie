import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createSessionToken } from "../../lib/auth/session.ts";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";
const username = process.env.ADMIN_USERNAME || "owner";
const secret = process.env.SESSION_SECRET || "test-session-secret-with-at-least-thirty-two-characters";

test("administrator can create, edit, and delete a category and open product editing", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([{
      name: "baoshijie_admin",
      value: createSessionToken(username, secret),
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax"
    }]);
    const page = await context.newPage();

    await page.goto(`${baseUrl}/admin/categories`);
    const createForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Add category" }) });
    await createForm.getByLabel("Name").fill("Browser Test Category");
    await createForm.getByLabel("Slug").fill("browser-test-category");
    await createForm.getByRole("button", { name: "Add category" }).click();
    await page.getByText("Category created.").waitFor();

    const record = page.locator("details", { hasText: "Browser Test Category" });
    await record.locator("summary").click();
    await record.getByLabel("Name").fill("Browser Test Category Updated");
    await record.getByRole("button", { name: "Save changes" }).click();
    await page.getByText("Category updated.").waitFor();

    const updated = page.locator("details", { hasText: "Browser Test Category Updated" });
    await updated.locator("summary").click();
    page.once("dialog", (dialog) => dialog.accept());
    await updated.getByRole("button", { name: "Delete" }).click();
    await page.getByText("Category deleted.").waitFor();
    assert.equal(await page.getByText("Browser Test Category Updated").count(), 0);

    await page.goto(`${baseUrl}/admin/products`);
    await page.getByRole("link", { name: "Add product" }).waitFor();
    const firstEdit = page.getByRole("link", { name: /^Edit / }).first();
    assert.equal(await firstEdit.count(), 1);
    await firstEdit.click();
    await page.getByRole("heading", { name: "Edit product" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Save product" }).count(), 1);
  } finally {
    await browser.close();
  }
});
