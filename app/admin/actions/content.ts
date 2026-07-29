"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMediaSlotForm, parseSiteSettingsForm, parseSocialLinkForm } from "@/lib/admin/content-input";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createMediaAsset,
  createSocialLink,
  deleteSocialLink,
  restoreMediaSlot,
  updateMediaSlot,
  updateSiteSettings,
  updateSocialLink
} from "@/lib/content/repository";
import { getDatabase } from "@/lib/db/client";
import { saveImageUpload } from "@/lib/media/storage";

function message(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint failed")) return "This media file or link already exists.";
    return error.message;
  }
  return "The requested change could not be saved.";
}

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(message(error))}`);
}

function refreshContent() {
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/social");
  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}

async function storeOptionalImage(formData: FormData, field: string) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  const saved = await saveImageUpload(file);
  createMediaAsset(getDatabase(), saved);
  return saved.publicUrl;
}

export async function updateSiteSettingsAction(formData: FormData) {
  await requireAdmin();
  try {
    const input = parseSiteSettingsForm(formData);
    const uploadedLogo = await storeOptionalImage(formData, "logoFile");
    updateSiteSettings(getDatabase(), { ...input, logoUrl: uploadedLogo || input.logoUrl });
  } catch (error) {
    fail("/admin/settings", error);
  }
  refreshContent();
  redirect("/admin/settings?saved=settings-updated");
}

export async function createSocialLinkAction(formData: FormData) {
  await requireAdmin();
  try {
    createSocialLink(getDatabase(), parseSocialLinkForm(formData));
  } catch (error) {
    fail("/admin/social", error);
  }
  refreshContent();
  redirect("/admin/social?saved=social-created");
}

export async function updateSocialLinkAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    updateSocialLink(getDatabase(), id, parseSocialLinkForm(formData));
  } catch (error) {
    fail("/admin/social", error);
  }
  refreshContent();
  redirect("/admin/social?saved=social-updated");
}

export async function deleteSocialLinkAction(id: string) {
  await requireAdmin();
  try {
    deleteSocialLink(getDatabase(), id);
  } catch (error) {
    fail("/admin/social", error);
  }
  refreshContent();
  redirect("/admin/social?saved=social-deleted");
}

export async function updateMediaSlotAction(slotKey: string, formData: FormData) {
  await requireAdmin();
  try {
    const input = parseMediaSlotForm(formData);
    const uploaded = await storeOptionalImage(formData, "imageFile");
    updateMediaSlot(getDatabase(), slotKey, { ...input, imageUrl: uploaded || input.imageUrl });
  } catch (error) {
    fail("/admin/media", error);
  }
  refreshContent();
  redirect("/admin/media?saved=media-updated");
}

export async function restoreMediaSlotAction(slotKey: string) {
  await requireAdmin();
  try {
    restoreMediaSlot(getDatabase(), slotKey);
  } catch (error) {
    fail("/admin/media", error);
  }
  refreshContent();
  redirect("/admin/media?saved=media-restored");
}
