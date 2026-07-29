import { AdminNotice } from "@/components/admin/AdminNotice";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "@/app/admin/actions/catalog";
import { listCategories } from "@/lib/catalog/repository";
import { getDatabase } from "@/lib/db/client";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const categories = listCategories(getDatabase(), { includeInactive: true });
  return (
    <div className="admin-page admin-editor-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Catalog</p><h1>New product</h1></div></header>
      <AdminNotice error={query.error} />
      <ProductForm action={createProductAction} categories={categories} submitLabel="Create product" />
    </div>
  );
}
