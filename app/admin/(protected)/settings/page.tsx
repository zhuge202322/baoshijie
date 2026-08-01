import { Save } from "lucide-react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { updateSiteSettingsAction } from "@/app/admin/actions/content";
import { getSiteSettings } from "@/lib/content/repository";
import { getDatabase } from "@/lib/db/client";
import { getShippingRates } from "@/lib/checkout/shipping";

function formatDollarInput(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const database = getDatabase();
  const settings = getSiteSettings(database);
  const shippingRates = getShippingRates(database);

  return (
    <div className="admin-page admin-editor-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Brand, support, and checkout</p><h1>Site settings</h1></div></header>
      <AdminNotice error={query.error} saved={query.saved} />
      <form action={updateSiteSettingsAction} className="admin-editor-form">
        <section className="admin-form-section">
          <div className="admin-form-heading"><div><p className="admin-kicker">Identity</p><h2>Brand</h2></div></div>
          <div className="admin-form-grid">
            <label className="admin-field">Website name<input name="websiteName" defaultValue={settings.websiteName} required maxLength={120} /></label>
            <label className="admin-field">Current logo URL<input name="logoUrl" defaultValue={settings.logoUrl} required /></label>
            <label className="admin-field admin-field-wide">Upload replacement logo<input name="logoFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" /></label>
            <div className="admin-logo-preview admin-field-wide"><img src={settings.logoUrl} alt="Current site logo" /></div>
          </div>
        </section>
        <section className="admin-form-section">
          <div className="admin-form-heading"><div><p className="admin-kicker">Customer service</p><h2>Contact details</h2></div></div>
          <div className="admin-form-grid">
            <label className="admin-field">Support email<input name="supportEmail" type="email" defaultValue={settings.supportEmail} maxLength={254} /></label>
            <label className="admin-field">Support phone<input name="supportPhone" defaultValue={settings.supportPhone} maxLength={80} /></label>
            <label className="admin-field">WhatsApp<input name="supportWhatsapp" defaultValue={settings.supportWhatsapp} maxLength={80} /></label>
            <label className="admin-field admin-field-wide">Company address<textarea name="companyAddress" defaultValue={settings.companyAddress} rows={4} maxLength={500} /></label>
          </div>
        </section>
        <section className="admin-form-section">
          <div className="admin-form-heading"><div><p className="admin-kicker">Checkout</p><h2>Shipping rates</h2></div></div>
          <div className="admin-form-grid">
            <label className="admin-field">Standard Shipping (USD)<input name="standardShipping" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={formatDollarInput(shippingRates.standard)} required /></label>
            <label className="admin-field">Premium Expedited Air (USD)<input name="expeditedShipping" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={formatDollarInput(shippingRates.expedited)} required /></label>
          </div>
        </section>
        <div className="admin-form-actions"><button className="admin-button admin-button-primary" type="submit"><Save size={16} /> Save settings</button></div>
      </form>
    </div>
  );
}
