"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  archiveProduct,
  createCategory,
  createProduct,
  deleteCategory,
  removeProduct,
  updateCategory,
  updateProduct
} from "@/lib/catalog/repository";
import { parseCategoryForm, parseProductForm } from "@/lib/admin/catalog-input";
import { getDatabase } from "@/lib/db/client";

function message(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint failed")) return "A record with that slug or part number already exists.";
    if (error.message.includes("FOREIGN KEY constraint failed")) return "The selected category no longer exists.";
    return error.message;
  }
  return "The requested change could not be saved.";
}

function fail(path: string, error: unknown): never {
  redirect(`${path}?error=${encodeURIComponent(message(error))}`);
}

function refreshCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/", "layout");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  try {
    createCategory(getDatabase(), parseCategoryForm(formData));
  } catch (error) {
    fail("/admin/categories", error);
  }
  refreshCatalog();
  redirect("/admin/categories?saved=category-created");
}

export async function updateCategoryAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    updateCategory(getDatabase(), id, parseCategoryForm(formData));
  } catch (error) {
    fail("/admin/categories", error);
  }
  refreshCatalog();
  redirect("/admin/categories?saved=category-updated");
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  try {
    deleteCategory(getDatabase(), id);
  } catch (error) {
    fail("/admin/categories", error);
  }
  refreshCatalog();
  redirect("/admin/categories?saved=category-deleted");
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  let productId = "";
  try {
    productId = createProduct(getDatabase(), parseProductForm(formData)).id;
  } catch (error) {
    fail("/admin/products/new", error);
  }
  refreshCatalog();
  redirect(`/admin/products/${productId}?saved=product-created`);
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    updateProduct(getDatabase(), id, parseProductForm(formData));
  } catch (error) {
    fail(`/admin/products/${id}`, error);
  }
  refreshCatalog();
  redirect(`/admin/products/${id}?saved=product-updated`);
}

export async function setProductArchivedAction(id: string, archived: boolean) {
  await requireAdmin();
  try {
    archiveProduct(getDatabase(), id, archived);
  } catch (error) {
    fail(`/admin/products/${id}`, error);
  }
  refreshCatalog();
  redirect(`/admin/products/${id}?saved=${archived ? "product-archived" : "product-restored"}`);
}

export async function removeProductAction(id: string) {
  await requireAdmin();
  let result: "deleted" | "archived" = "deleted";
  try {
    result = removeProduct(getDatabase(), id);
  } catch (error) {
    fail(`/admin/products/${id}`, error);
  }
  refreshCatalog();
  redirect(`/admin/products?saved=product-${result}`);
}
