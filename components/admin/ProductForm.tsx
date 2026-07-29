import Link from "next/link";
import { Save } from "lucide-react";
import type { CategoryRecord, ProductRecord } from "@/lib/catalog/repository";

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryRecord[];
  product?: ProductRecord;
  submitLabel: string;
};

export function ProductForm({ action, categories, product, submitLabel }: ProductFormProps) {
  const compatibility = product?.compatibility.join("\n") || "";
  const specs = product
    ? Object.entries(product.specs).map(([key, value]) => `${key}: ${value}`).join("\n")
    : "";

  return (
    <form action={action} className="admin-editor-form">
      <section className="admin-form-section">
        <div className="admin-form-heading"><p className="admin-kicker">Identity</p><h2>Product details</h2></div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-wide">Name<input name="name" defaultValue={product?.name} required maxLength={180} /></label>
          <label className="admin-field">Slug<input name="slug" defaultValue={product?.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
          <label className="admin-field">Part number<input name="partNo" defaultValue={product?.partNo} required maxLength={120} /></label>
          <label className="admin-field">Category<select name="categoryId" defaultValue={product?.categoryId} required>
            <option value="" disabled>Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? "" : " (inactive)"}</option>)}
          </select></label>
          <label className="admin-field">Product type<select name="productType" defaultValue={product?.productType || "Bespoke"}>
            <option value="Bespoke">Bespoke</option><option value="OE aftermarket">OE aftermarket</option>
          </select></label>
          <label className="admin-field">Material<input name="material" defaultValue={product?.material} required maxLength={120} /></label>
          <label className="admin-field">Price (USD)<input name="price" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""} required /></label>
          <label className="admin-field">Inventory<select name="inventoryStatus" defaultValue={product?.inventoryStatus || "made_to_order"}>
            <option value="in_stock">In stock</option><option value="made_to_order">Made to order</option><option value="unavailable">Unavailable</option>
          </select></label>
          <label className="admin-field">Badge<input name="badge" defaultValue={product?.badge} maxLength={100} placeholder="Optional" /></label>
          <label className="admin-toggle admin-field-wide"><input name="isActive" type="checkbox" defaultChecked={product?.isActive ?? true} /> Active and visible in storefront</label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading"><p className="admin-kicker">Storefront</p><h2>Images and copy</h2></div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-wide">Image URL<input name="imageUrl" defaultValue={product?.imageUrl} required placeholder="/images/products/example.png" /></label>
          {product?.imageUrl ? <div className="admin-product-preview admin-field-wide"><img src={product.imageUrl} alt="Current product" /></div> : null}
          <label className="admin-field admin-field-wide">Short description<textarea name="shortDescription" defaultValue={product?.shortDescription} required rows={3} maxLength={1000} /></label>
          <label className="admin-field admin-field-wide">Full description<textarea name="description" defaultValue={product?.description} required rows={7} maxLength={10000} /></label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading"><p className="admin-kicker">Fitment</p><h2>Compatibility and specifications</h2></div>
        <div className="admin-form-grid">
          <label className="admin-field">Compatibility<textarea name="compatibility" defaultValue={compatibility} rows={7} placeholder="One vehicle or model range per line" /></label>
          <label className="admin-field">Specifications<textarea name="specs" defaultValue={specs} rows={7} placeholder="Material: Carbon fiber&#10;Finish: Satin" /></label>
        </div>
      </section>

      <div className="admin-form-actions">
        <Link className="admin-button" href="/admin/products">Cancel</Link>
        <button className="admin-button admin-button-primary" type="submit"><Save size={16} aria-hidden="true" /> {submitLabel}</button>
      </div>
    </form>
  );
}
