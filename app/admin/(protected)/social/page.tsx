import { Link2, Plus, Save } from "lucide-react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { createSocialLinkAction, deleteSocialLinkAction, updateSocialLinkAction } from "@/app/admin/actions/content";
import { listSocialLinks } from "@/lib/content/repository";
import { getDatabase } from "@/lib/db/client";

export default async function AdminSocialPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const links = listSocialLinks(getDatabase(), { includeInactive: true });

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Navigation</p><h1>Social links</h1></div></header>
      <AdminNotice error={query.error} saved={query.saved} />
      <section className="admin-form-section">
        <div className="admin-form-heading"><Link2 size={20} /><div><p className="admin-kicker">New</p><h2>Add social link</h2></div></div>
        <form action={createSocialLinkAction} className="admin-form-grid">
          <label className="admin-field">Platform<input name="platform" required placeholder="instagram" /></label>
          <label className="admin-field">Label<input name="label" required placeholder="Instagram" /></label>
          <label className="admin-field admin-field-wide">URL<input name="url" type="url" required placeholder="https://..." /></label>
          <label className="admin-field">Sort order<input name="sortOrder" type="number" step="1" defaultValue="0" /></label>
          <label className="admin-toggle"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
          <div className="admin-form-actions admin-field-wide"><button className="admin-button admin-button-primary" type="submit"><Plus size={16} /> Add link</button></div>
        </form>
      </section>
      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="admin-kicker">Published links</p><h2>{links.length} records</h2></div></div>
        <div className="admin-record-list">
          {links.map((link) => (
            <details className="admin-record" key={link.id}>
              <summary><span><strong>{link.label}</strong><small>{link.url}</small></span><span>{link.platform} · {link.isActive ? "Active" : "Inactive"}</span></summary>
              <form action={updateSocialLinkAction.bind(null, link.id)} className="admin-form-grid admin-record-body">
                <label className="admin-field">Platform<input name="platform" defaultValue={link.platform} required /></label>
                <label className="admin-field">Label<input name="label" defaultValue={link.label} required /></label>
                <label className="admin-field admin-field-wide">URL<input name="url" type="url" defaultValue={link.url} required /></label>
                <label className="admin-field">Sort order<input name="sortOrder" type="number" step="1" defaultValue={link.sortOrder} /></label>
                <label className="admin-toggle"><input name="isActive" type="checkbox" defaultChecked={link.isActive} /> Active</label>
                <div className="admin-form-actions admin-field-wide">
                  <ConfirmSubmitButton form={`delete-${link.id}`} label="Delete" message={`Delete ${link.label}?`} />
                  <button className="admin-button admin-button-primary" type="submit"><Save size={15} /> Save changes</button>
                </div>
              </form>
              <form action={deleteSocialLinkAction.bind(null, link.id)} id={`delete-${link.id}`} />
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
