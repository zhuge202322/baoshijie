import Link from "next/link";
import { Search } from "lucide-react";
import { formatUsd } from "@/lib/catalog/model";
import { getDatabase } from "@/lib/db/client";
import { listOrders } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/orders/transitions";

const statuses: OrderStatus[] = [
  "PENDING_PAYMENT", "PAYMENT_PROCESSING", "PAID", "PAYMENT_FAILED",
  "CONFIRMED", "PROCESSING", "SHIPPED", "CANCELLED", "REFUNDED"
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; query?: string }> }) {
  const search = await searchParams;
  const status = statuses.includes(search.status as OrderStatus) ? search.status as OrderStatus : "";
  const orders = listOrders(getDatabase(), { status, query: search.query });

  return (
    <div className="admin-page">
      <header className="admin-page-header"><div><p className="admin-kicker">Operations</p><h1>Orders</h1></div></header>
      <form className="admin-order-filters" action="/admin/orders" method="get">
        <label><span className="sr-only">Search orders</span><Search size={17} /><input name="query" defaultValue={search.query} placeholder="Order, email, customer, provider reference" /></label>
        <select name="status" defaultValue={status} aria-label="Order status"><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
        <button className="admin-button" type="submit">Filter</button>
      </form>
      {orders.length === 0 ? <div className="admin-empty"><p>No matching orders.</p></div> : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-orders-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>Placed</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td><span className="admin-customer-cell"><strong>{order.firstName} {order.lastName}</strong><small>{order.email}</small></span></td>
                <td><span className={`admin-status admin-order-status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span></td>
                <td>{order.paymentProvider}</td>
                <td className="mono">{formatUsd(order.totalCents)}</td>
                <td>{new Date(order.createdAt).toLocaleString("en-US")}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
