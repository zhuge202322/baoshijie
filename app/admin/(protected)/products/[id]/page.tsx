import { Archive, RotateCcw } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { removeProductAction, setProductArchivedAction, updateProductAction } from "@/app/admin/actions/catalog";
import { getProductById, listCategories } from "@/lib/catalog/repository";
import { getDatabase } from "@/lib/db/client";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const database = getDatabase();
  const product = getProductById(database, id);
  if (!product) notFound();
  const categories = listCategories(database, { includeInactive: true });

  return (
    <div className="admin-page admin-editor-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Catalog</p><h1>Edit product</h1><p className="admin-subtitle mono">{product.partNo}</p></div></header>
      <AdminNotice error={query.error} saved={query.saved} />
      <ProductForm action={updateProductAction.bind(null, id)} categories={categories} product={product} submitLabel="Save product" />
      <section className="admin-danger-zone">
        <div><p className="admin-kicker">Availability</p><h2>Archive or delete</h2><p>Archiving hides this product. Delete removes unused products; products in order history are archived automatically.</p></div>
        <div className="admin-form-actions">
          <form action={setProductArchivedAction.bind(null, id, product.isActive)}>
            <button className="admin-button" type="submit">{product.isActive ? <Archive size={15} /> : <RotateCcw size={15} />}{product.isActive ? "Archive" : "Restore"}</button>
          </form>
          <form action={removeProductAction.bind(null, id)}><ConfirmSubmitButton label="Delete product" message={`Delete ${product.name}?`} /></form>
        </div>
      </section>
    </div>
  );
}
