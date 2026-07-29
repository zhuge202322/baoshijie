import Link from "next/link";
import { Archive, Edit3, Plus, RotateCcw } from "lucide-react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { setProductArchivedAction } from "@/app/admin/actions/catalog";
import { listCategories, listProducts } from "@/lib/catalog/repository";
import { getDatabase } from "@/lib/db/client";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const database = getDatabase();
  const products = listProducts(database, { includeInactive: true });
  const categoryNames = new Map(listCategories(database, { includeInactive: true }).map((item) => [item.id, item.name]));

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-kicker">Catalog</p><h1>Products</h1></div>
        <Link className="admin-button admin-button-primary" href="/admin/products/new"><Plus size={16} /> Add product</Link>
      </header>
      <AdminNotice error={query.error} saved={query.saved} />
      <div className="admin-table-wrap">
        <table className="admin-table admin-products-table">
          <thead><tr><th>Product</th><th>Category</th><th>Part no.</th><th>Price</th><th>Inventory</th><th>Visibility</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{products.map((product) => (
            <tr key={product.id}>
              <td><Link className="admin-product-cell" href={`/admin/products/${product.id}`}><img src={product.imageUrl} alt="" /><span><strong>{product.name}</strong><small>/{product.slug}</small></span></Link></td>
              <td>{categoryNames.get(product.categoryId) || "Unknown"}</td>
              <td className="mono">{product.partNo}</td>
              <td className="mono">${(product.priceCents / 100).toFixed(2)}</td>
              <td>{product.inventoryStatus.replaceAll("_", " ")}</td>
              <td><span className={`admin-status ${product.isActive ? "admin-status-active" : ""}`}>{product.isActive ? "Active" : "Archived"}</span></td>
              <td><div className="admin-row-actions">
                <Link className="admin-icon-button" href={`/admin/products/${product.id}`} title="Edit product" aria-label={`Edit ${product.name}`}><Edit3 size={16} /></Link>
                <form action={setProductArchivedAction.bind(null, product.id, product.isActive)}>
                  <button className="admin-icon-button" type="submit" title={product.isActive ? "Archive product" : "Restore product"} aria-label={`${product.isActive ? "Archive" : "Restore"} ${product.name}`}>
                    {product.isActive ? <Archive size={16} /> : <RotateCcw size={16} />}
                  </button>
                </form>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
