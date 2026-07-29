"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getDatabase } from "@/lib/db/client";
import { transitionOrderAsAdmin, updateOrderInternalNote } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/orders/transitions";

function fail(id: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Order could not be updated";
  redirect(`/admin/orders/${id}?error=${encodeURIComponent(message)}`);
}

function refresh(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderNoteAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    updateOrderInternalNote(getDatabase(), id, String(formData.get("internalNote") || ""));
  } catch (error) {
    fail(id, error);
  }
  refresh(id);
  redirect(`/admin/orders/${id}?saved=order-note-updated`);
}

export async function transitionOrderAction(id: string, next: OrderStatus) {
  await requireAdmin();
  try {
    transitionOrderAsAdmin(getDatabase(), id, next);
  } catch (error) {
    fail(id, error);
  }
  refresh(id);
  redirect(`/admin/orders/${id}?saved=order-status-updated`);
}
