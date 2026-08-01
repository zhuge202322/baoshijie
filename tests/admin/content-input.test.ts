import assert from "node:assert/strict";
import test from "node:test";
import { parseMediaSlotForm, parseShippingRatesForm, parseSiteSettingsForm, parseSocialLinkForm } from "../../lib/admin/content-input.ts";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("site settings forms normalize contact fields", () => {
  assert.deepEqual(parseSiteSettingsForm(form({
    websiteName: "  Bespoke Elemental Europe ",
    logoUrl: "/brand/logo.png",
    supportEmail: " parts@example.com ",
    supportPhone: "+44 20 1234 5678",
    supportWhatsapp: "+44 20 1234 5678",
    companyAddress: " London, UK "
  })), {
    websiteName: "Bespoke Elemental Europe",
    logoUrl: "/brand/logo.png",
    supportEmail: "parts@example.com",
    supportPhone: "+44 20 1234 5678",
    supportWhatsapp: "+44 20 1234 5678",
    companyAddress: "London, UK"
  });
});

test("social and media forms parse ordering, activation, and alt text", () => {
  assert.deepEqual(parseSocialLinkForm(form({
    platform: "Instagram",
    label: "Instagram Europe",
    url: "https://instagram.com/example",
    sortOrder: "15",
    isActive: "on"
  })), {
    platform: "Instagram",
    label: "Instagram Europe",
    url: "https://instagram.com/example",
    sortOrder: 15,
    isActive: true
  });
  assert.deepEqual(parseMediaSlotForm(form({ imageUrl: "/images/hero.jpg", altText: "Classic Porsche 911" })), {
    imageUrl: "/images/hero.jpg",
    altText: "Classic Porsche 911"
  });
});

test("shipping settings parse dollar amounts into integer cents", () => {
  assert.deepEqual(parseShippingRatesForm(form({
    standardShipping: "18.99",
    expeditedShipping: "52.75"
  })), { standard: 1899, expedited: 5275 });
  assert.throws(() => parseShippingRatesForm(form({
    standardShipping: "18.999",
    expeditedShipping: "52.75"
  })), /up to two decimal places/);
});
