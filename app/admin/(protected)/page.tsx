import Link from "next/link";
import { ArrowRight, Boxes, FolderTree, ImageIcon, ShoppingBag } from "lucide-react";
import { getDatabase } from "@/lib/db/client";

function count(database: ReturnType<typeof getDatabase>, table: string, where = "") {
  return Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table} ${where}`).get()?.count || 0);
}

export default function AdminDashboardPage() {
  const database = getDatabase();
  const stats = [
    { label: "Products", value: count(database, "products"), href: "/admin/products", icon: Boxes },
    { label: "Active categories", value: count(database, "categories", "WHERE is_active = 1"), href: "/admin/categories", icon: FolderTree },
    { label: "Orders", value: count(database, "orders"), href: "/admin/orders", icon: ShoppingBag },
    { label: "Managed images", value: count(database, "media_slots"), href: "/admin/media", icon: ImageIcon }
  ];
  const recentOrders = database.prepare(`
    SELECT id, order_number, status, total_cents, email, created_at
    FROM orders ORDER BY created_at DESC LIMIT 6
  `).all();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-kicker">Overview</p><h1>Dashboard</h1></div>
        <Link className="admin-view-store" href="/" target="_blank">View storefront <ArrowRight size={16} /></Link>
      </header>

      <section className="admin-stats" aria-label="Store totals">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="admin-stat">
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <div><p className="admin-kicker">Operations</p><h2>Recent orders</h2></div>
          <Link href="/admin/orders">All orders <ArrowRight size={15} /></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="admin-empty"><ShoppingBag size={26} /><p>No orders have been placed yet.</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th><th>Placed</th></tr></thead>
              <tbody>{recentOrders.map((order) => (
                <tr key={String(order.id)}>
                  <td><Link href={`/admin/orders/${order.id}`}>{String(order.order_number)}</Link></td>
                  <td>{String(order.email)}</td>
                  <td><span className="admin-status">{String(order.status).replaceAll("_", " ")}</span></td>
                  <td>${(Number(order.total_cents) / 100).toFixed(2)}</td>
                  <td>{new Date(Number(order.created_at)).toLocaleDateString("en-US")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
