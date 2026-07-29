import { randomUUID } from "node:crypto";
import type { CommerceDatabase } from "../db/client.ts";
import {
  optionalText,
  requireImageUrl,
  requireSortOrder,
  requireText,
  requireWebUrl,
  toBoolean
} from "../validation/common.ts";

export type SiteSettings = {
  websiteName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  companyAddress: string;
};

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
};

export type MediaSlot = {
  slotKey: string;
  page: string;
  sectionLabel: string;
  imageUrl: string;
  defaultImageUrl: string;
  altText: string;
  sortOrder: number;
};

export function getSiteSettings(database: CommerceDatabase): SiteSettings {
  const row = database.prepare("SELECT * FROM site_settings WHERE id = 1").get();
  if (!row) throw new Error("Site settings are not initialized");
  return {
    websiteName: String(row.website_name),
    logoUrl: String(row.logo_url),
    supportEmail: String(row.support_email),
    supportPhone: String(row.support_phone),
    supportWhatsapp: String(row.support_whatsapp),
    companyAddress: String(row.company_address)
  };
}

export function updateSiteSettings(database: CommerceDatabase, input: SiteSettings) {
  const value = {
    websiteName: requireText(input.websiteName, "Website name", 120),
    logoUrl: requireImageUrl(input.logoUrl),
    supportEmail: optionalText(input.supportEmail, "Support email", 254),
    supportPhone: optionalText(input.supportPhone, "Support phone", 80),
    supportWhatsapp: optionalText(input.supportWhatsapp, "Support WhatsApp", 80),
    companyAddress: optionalText(input.companyAddress, "Company address", 500)
  };
  database
    .prepare(`
      UPDATE site_settings SET website_name = ?, logo_url = ?, support_email = ?, support_phone = ?,
      support_whatsapp = ?, company_address = ?, updated_at = ? WHERE id = 1
    `)
    .run(
      value.websiteName,
      value.logoUrl,
      value.supportEmail,
      value.supportPhone,
      value.supportWhatsapp,
      value.companyAddress,
      Date.now()
    );
  return value;
}

function mapSocial(row: Record<string, unknown>): SocialLink {
  return {
    id: String(row.id),
    platform: String(row.platform),
    label: String(row.label),
    url: String(row.url),
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active)
  };
}

export function listSocialLinks(database: CommerceDatabase, options: { includeInactive?: boolean } = {}) {
  const rows = database
    .prepare(`SELECT * FROM social_links ${options.includeInactive ? "" : "WHERE is_active = 1"} ORDER BY sort_order, label`)
    .all() as Record<string, unknown>[];
  return rows.map(mapSocial);
}

function validateSocial(input: Omit<SocialLink, "id">) {
  return {
    platform: requireText(input.platform, "Platform", 60).toLowerCase(),
    label: requireText(input.label, "Social label", 100),
    url: requireWebUrl(input.url, "Social URL"),
    sortOrder: requireSortOrder(input.sortOrder),
    isActive: toBoolean(input.isActive)
  };
}

export function createSocialLink(database: CommerceDatabase, input: Omit<SocialLink, "id">) {
  const value = validateSocial(input);
  const id = `social-${randomUUID()}`;
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO social_links (id, platform, label, url, sort_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, value.platform, value.label, value.url, value.sortOrder, Number(value.isActive), now, now);
  return { id, ...value };
}

export function updateSocialLink(database: CommerceDatabase, id: string, input: Omit<SocialLink, "id">) {
  const value = validateSocial(input);
  const result = database
    .prepare(`
      UPDATE social_links SET platform = ?, label = ?, url = ?, sort_order = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(value.platform, value.label, value.url, value.sortOrder, Number(value.isActive), Date.now(), id);
  if (result.changes === 0) throw new Error("Social link not found");
  return { id, ...value };
}

export function deleteSocialLink(database: CommerceDatabase, id: string) {
  const result = database.prepare("DELETE FROM social_links WHERE id = ?").run(id);
  if (result.changes === 0) throw new Error("Social link not found");
}

function mapMedia(row: Record<string, unknown>): MediaSlot {
  return {
    slotKey: String(row.slot_key),
    page: String(row.page),
    sectionLabel: String(row.section_label),
    imageUrl: String(row.image_url),
    defaultImageUrl: String(row.default_image_url),
    altText: String(row.alt_text),
    sortOrder: Number(row.sort_order)
  };
}

export function listMediaSlots(database: CommerceDatabase, page?: string) {
  const rows = page
    ? database.prepare("SELECT * FROM media_slots WHERE page = ? ORDER BY sort_order, slot_key").all(page)
    : database.prepare("SELECT * FROM media_slots ORDER BY page, sort_order, slot_key").all();
  return (rows as Record<string, unknown>[]).map(mapMedia);
}

export function updateMediaSlot(
  database: CommerceDatabase,
  slotKey: string,
  input: { imageUrl: string; altText: string }
) {
  const imageUrl = requireImageUrl(input.imageUrl);
  const altText = requireText(input.altText, "Alternative text", 500);
  const result = database
    .prepare("UPDATE media_slots SET image_url = ?, alt_text = ?, updated_at = ? WHERE slot_key = ?")
    .run(imageUrl, altText, Date.now(), slotKey);
  if (result.changes === 0) throw new Error("Media slot not found");
}

export function restoreMediaSlot(database: CommerceDatabase, slotKey: string) {
  const result = database
    .prepare("UPDATE media_slots SET image_url = default_image_url, updated_at = ? WHERE slot_key = ?")
    .run(Date.now(), slotKey);
  if (result.changes === 0) throw new Error("Media slot not found");
}
