import type { MediaSlot, SiteSettings, SocialLink } from "../content/repository.ts";

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function integer(value: string) {
  if (!/^-?\d+$/.test(value)) throw new Error("Sort order must be an integer");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("Sort order must be an integer");
  return parsed;
}

export function parseSiteSettingsForm(data: FormData): SiteSettings {
  return {
    websiteName: text(data, "websiteName"),
    logoUrl: text(data, "logoUrl"),
    supportEmail: text(data, "supportEmail"),
    supportPhone: text(data, "supportPhone"),
    supportWhatsapp: text(data, "supportWhatsapp"),
    companyAddress: text(data, "companyAddress")
  };
}

export function parseSocialLinkForm(data: FormData): Omit<SocialLink, "id"> {
  return {
    platform: text(data, "platform"),
    label: text(data, "label"),
    url: text(data, "url"),
    sortOrder: integer(text(data, "sortOrder") || "0"),
    isActive: data.has("isActive")
  };
}

export function parseMediaSlotForm(data: FormData): Pick<MediaSlot, "imageUrl" | "altText"> {
  return { imageUrl: text(data, "imageUrl"), altText: text(data, "altText") };
}
