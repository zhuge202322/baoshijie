import { RotateCcw, Save } from "lucide-react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { restoreMediaSlotAction, updateMediaSlotAction } from "@/app/admin/actions/content";
import { listMediaSlots } from "@/lib/content/repository";
import { getDatabase } from "@/lib/db/client";

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const slots = listMediaSlots(getDatabase());
  const pages = Map.groupBy(slots, (slot) => slot.page);

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Content</p><h1>Page images</h1></div></header>
      <AdminNotice error={query.error} saved={query.saved} />
      {[...pages].map(([page, pageSlots]) => (
        <section className="admin-section admin-media-section" key={page}>
          <div className="admin-section-heading"><div><p className="admin-kicker">Page</p><h2>{page}</h2></div><span>{pageSlots.length} image slots</span></div>
          <div className="admin-media-grid">
            {pageSlots.map((slot) => (
              <article className="admin-media-item" key={slot.slotKey}>
                <div className="admin-media-preview"><img src={slot.imageUrl} alt={slot.altText} /></div>
                <form action={updateMediaSlotAction.bind(null, slot.slotKey)} className="admin-media-form">
                  <div><strong>{slot.sectionLabel}</strong><small className="mono">{slot.slotKey}</small></div>
                  <label className="admin-field">Image URL<input name="imageUrl" defaultValue={slot.imageUrl} required /></label>
                  <label className="admin-field">Upload replacement<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
                  <label className="admin-field">Alternative text<textarea name="altText" defaultValue={slot.altText} rows={3} required maxLength={500} /></label>
                  <div className="admin-form-actions">
                    <button className="admin-button admin-button-primary" type="submit"><Save size={15} /> Save</button>
                  </div>
                </form>
                <form action={restoreMediaSlotAction.bind(null, slot.slotKey)} className="admin-media-restore">
                  <button className="admin-button" type="submit"><RotateCcw size={15} /> Restore default</button>
                </form>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
