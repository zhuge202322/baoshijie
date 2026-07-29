import { FolderPlus, Save } from "lucide-react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/admin/actions/catalog";
import { listCategories } from "@/lib/catalog/repository";
import { getDatabase } from "@/lib/db/client";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const database = getDatabase();
  const categories = listCategories(database, { includeInactive: true });
  const counts = new Map((database.prepare("SELECT category_id, COUNT(*) AS count FROM products GROUP BY category_id").all() as Record<string, unknown>[])
    .map((row) => [String(row.category_id), Number(row.count)]));

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Catalog</p><h1>Categories</h1></div></header>
      <AdminNotice error={query.error} saved={query.saved} />

      <section className="admin-form-section">
        <div className="admin-form-heading"><FolderPlus size={20} /><div><p className="admin-kicker">New</p><h2>Add category</h2></div></div>
        <form action={createCategoryAction} className="admin-form-grid">
          <label className="admin-field">Name<input name="name" required maxLength={120} /></label>
          <label className="admin-field">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
          <label className="admin-field admin-field-wide">Description<textarea name="description" rows={3} maxLength={1000} /></label>
          <label className="admin-field">Sort order<input name="sortOrder" type="number" step="1" defaultValue="0" required /></label>
          <label className="admin-toggle"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
          <div className="admin-form-actions admin-field-wide"><button className="admin-button admin-button-primary" type="submit"><FolderPlus size={16} /> Add category</button></div>
        </form>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-kicker">Structure</p><h2>{categories.length} categories</h2></div></div>
        <div className="admin-record-list">
          {categories.map((category) => (
            <details className="admin-record" key={category.id}>
              <summary><span><strong>{category.name}</strong><small>/{category.slug}</small></span><span>{counts.get(category.id) || 0} products · {category.isActive ? "Active" : "Inactive"}</span></summary>
              <form action={updateCategoryAction.bind(null, category.id)} className="admin-form-grid admin-record-body">
                <label className="admin-field">Name<input name="name" defaultValue={category.name} required /></label>
                <label className="admin-field">Slug<input name="slug" defaultValue={category.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
                <label className="admin-field admin-field-wide">Description<textarea name="description" defaultValue={category.description} rows={3} /></label>
                <label className="admin-field">Sort order<input name="sortOrder" type="number" step="1" defaultValue={category.sortOrder} /></label>
                <label className="admin-toggle"><input name="isActive" type="checkbox" defaultChecked={category.isActive} /> Active</label>
                <div className="admin-form-actions admin-field-wide">
                  <ConfirmSubmitButton form={`delete-${category.id}`} label="Delete" message={`Delete ${category.name}? Categories containing products cannot be deleted.`} />
                  <button className="admin-button admin-button-primary" type="submit"><Save size={15} /> Save changes</button>
                </div>
              </form>
              <form action={deleteCategoryAction.bind(null, category.id)} className="admin-delete-proxy" id={`delete-${category.id}`} />
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
