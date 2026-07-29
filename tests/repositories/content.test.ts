import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase, migrateDatabase } from "../../lib/db/client.ts";
import { seedDatabase } from "../../lib/db/seed.ts";
import {
  createMediaAsset,
  createSocialLink,
  deleteSocialLink,
  getSiteSettings,
  listMediaSlots,
  listSocialLinks,
  restoreMediaSlot,
  updateMediaSlot,
  updateSiteSettings
} from "../../lib/content/repository.ts";

function setup() {
  const database = createDatabase(":memory:");
  migrateDatabase(database);
  seedDatabase(database);
  return database;
}

test("site name, logo, and customer service contacts can be updated", () => {
  const database = setup();
  try {
    updateSiteSettings(database, {
      websiteName: "Bespoke Elemental USA",
      logoUrl: "/media/new-logo.webp",
      supportEmail: "support@example.com",
      supportPhone: "+1 555 0100",
      supportWhatsapp: "+1 555 0100",
      companyAddress: "Los Angeles, CA"
    });
    assert.deepEqual({ ...getSiteSettings(database) }, {
      websiteName: "Bespoke Elemental USA",
      logoUrl: "/media/new-logo.webp",
      supportEmail: "support@example.com",
      supportPhone: "+1 555 0100",
      supportWhatsapp: "+1 555 0100",
      companyAddress: "Los Angeles, CA"
    });
  } finally {
    database.close();
  }
});

test("social links support create, order, activation, and delete", () => {
  const database = setup();
  try {
    const link = createSocialLink(database, {
      platform: "youtube",
      label: "YouTube",
      url: "https://www.youtube.com/@bespoke",
      sortOrder: 5,
      isActive: true
    });
    assert.equal(listSocialLinks(database)[0]?.id, link.id);
    deleteSocialLink(database, link.id);
    assert.equal(listSocialLinks(database, { includeInactive: true }).some((item) => item.id === link.id), false);
  } finally {
    database.close();
  }
});

test("media slots can be replaced and restored to seeded images", () => {
  const database = setup();
  try {
    updateMediaSlot(database, "home.hero.1", {
      imageUrl: "/media/replacement.webp",
      altText: "Replacement hero"
    });
    let slot = listMediaSlots(database, "home").find((item) => item.slotKey === "home.hero.1");
    assert.equal(slot?.imageUrl, "/media/replacement.webp");
    assert.equal(slot?.altText, "Replacement hero");

    restoreMediaSlot(database, "home.hero.1");
    slot = listMediaSlots(database, "home").find((item) => item.slotKey === "home.hero.1");
    assert.equal(slot?.imageUrl, "/images/bespoke-elemental/hero-01.png");
  } finally {
    database.close();
  }
});

test("uploaded media metadata is recorded with a stable public URL", () => {
  const database = setup();
  try {
    const asset = createMediaAsset(database, {
      filename: "asset-id.webp",
      originalName: "hero.webp",
      mimeType: "image/webp",
      sizeBytes: 2048,
      publicUrl: "/media/asset-id.webp"
    });
    const row = database.prepare("SELECT * FROM media_assets WHERE id = ?").get(asset.id);
    assert.equal(row?.public_url, "/media/asset-id.webp");
    assert.equal(row?.size_bytes, 2048);
  } finally {
    database.close();
  }
});
