import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";
import { createSessionToken } from "../../lib/auth/session.ts";

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3012";
const username = process.env.ADMIN_USERNAME || "owner";
const secret = process.env.SESSION_SECRET || "test-session-secret-with-at-least-thirty-two-characters";
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

test("administrator can update settings, social links, and uploaded page media", async () => {
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

    await page.goto(`${baseUrl}/admin/settings`);
    await page.getByLabel("Support email").fill("browser-test@example.com");
    await page.getByRole("button", { name: "Save settings" }).click();
    await page.getByText("Site settings updated.").waitFor();
    assert.equal(await page.getByLabel("Support email").inputValue(), "browser-test@example.com");

    await page.goto(`${baseUrl}/admin/social`);
    const createForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Add link" }) });
    await createForm.getByLabel("Platform").fill("youtube");
    await createForm.getByLabel("Label").fill("Browser Test YouTube");
    await createForm.getByLabel("URL").fill("https://www.youtube.com/@browser-test");
    await createForm.getByRole("button", { name: "Add link" }).click();
    await page.getByText("Social link created.").waitFor();
    const social = page.locator("details", { hasText: "Browser Test YouTube" });
    await social.locator("summary").click();
    page.once("dialog", (dialog) => dialog.accept());
    await social.getByRole("button", { name: "Delete" }).click();
    await page.getByText("Social link deleted.").waitFor();

    await page.goto(`${baseUrl}/admin/media`);
    const media = page.locator("article", { hasText: "home.hero.1" });
    await media.getByLabel("Upload replacement").setInputFiles({ name: "browser-test.jpg", mimeType: "image/jpeg", buffer: jpeg });
    await media.getByLabel("Alternative text").fill("Browser uploaded hero");
    await media.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByText("Page image updated.").waitFor();

    const updated = page.locator("article", { hasText: "home.hero.1" });
    const imagePath = await updated.locator(".admin-media-preview img").getAttribute("src");
    assert.match(imagePath || "", /^\/media\//);
    const response = await page.request.get(`${baseUrl}${imagePath}`);
    assert.equal(response.status(), 200);
    assert.equal(response.headers()["content-type"], "image/jpeg");

    await updated.getByRole("button", { name: "Restore default" }).click();
    await page.getByText("Page image restored to its default.").waitFor();
    const restored = await page.locator("article", { hasText: "home.hero.1" }).locator(".admin-media-preview img").getAttribute("src");
    assert.equal(restored, "/images/bespoke-elemental/hero-01.png");
  } finally {
    await browser.close();
  }
});
