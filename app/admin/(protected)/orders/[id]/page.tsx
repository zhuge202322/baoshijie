import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNotice } from "@/components/admin/AdminNotice";
import { transitionOrderAction, updateOrderNoteAction } from "@/app/admin/actions/orders";
import { formatUsd } from "@/lib/catalog/model";
import { getDatabase } from "@/lib/db/client";
import { getOrderDetail } from "@/lib/orders/repository";
import type { OrderStatus } from "@/lib/orders/transitions";

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  PENDING_PAYMENT: "CANCELLED",
  PAYMENT_FAILED: "CANCELLED"
};

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const detail = getOrderDetail(getDatabase(), id);
  if (!detail) notFound();
  const { order, items, payments } = detail;
  const next = nextStatus[order.status];

  return (
    <div className="admin-page admin-order-detail">
      <Link className="admin-back-link" href="/admin/orders"><ArrowLeft size={15} /> Orders</Link>
      <header className="admin-page-header">
        <div><p className="admin-kicker">Order detail</p><h1>{order.orderNumber}</h1><p className="admin-subtitle">Placed {new Date(order.createdAt).toLocaleString("en-US")}</p></div>
        <span className={`admin-status admin-order-status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span>
      </header>
      <AdminNotice error={query.error} saved={query.saved} />

      <div className="admin-order-columns">
        <div>
          <section className="admin-form-section">
            <div className="admin-form-heading"><div><p className="admin-kicker">Items</p><h2>Order snapshot</h2></div></div>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Part</th><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>{items.map((item) => (
              <tr key={item.id}><td className="mono">{item.partNo}</td><td>{item.name}</td><td>{item.quantity}</td><td>{formatUsd(item.unitPriceCents)}</td><td>{formatUsd(item.lineTotalCents)}</td></tr>
            ))}</tbody></table></div>
            <div className="admin-order-totals"><span>Subtotal<strong>{formatUsd(order.subtotalCents)}</strong></span><span>Shipping ({order.shippingMethod})<strong>{formatUsd(order.shippingCents)}</strong></span><span>Total<strong>{formatUsd(order.totalCents)}</strong></span></div>
          </section>

          <section className="admin-form-section">
            <div className="admin-form-heading"><div><p className="admin-kicker">Provider</p><h2>Payment timeline</h2></div></div>
            {payments.length === 0 ? <p className="admin-muted">No provider payment has been initialized.</p> : <div className="admin-payment-list">{payments.map((payment) => (
              <div key={payment.id}><span className="admin-status">{payment.status}</span><span><strong>{payment.provider}</strong><small className="mono">{payment.providerPaymentId || "No provider ID"}</small></span><strong>{formatUsd(payment.amountCents)}</strong><time>{new Date(payment.updatedAt).toLocaleString("en-US")}</time></div>
            ))}</div>}
          </section>

          <section className="admin-form-section">
            <div className="admin-form-heading"><div><p className="admin-kicker">Private</p><h2>Internal note</h2></div></div>
            <form action={updateOrderNoteAction.bind(null, id)} className="admin-form-grid">
              <label className="admin-field admin-field-wide">Note<textarea name="internalNote" defaultValue={order.internalNote} rows={6} maxLength={5000} /></label>
              <div className="admin-form-actions admin-field-wide"><button className="admin-button admin-button-primary" type="submit"><Save size={15} /> Save note</button></div>
            </form>
          </section>
        </div>

        <aside>
          <section className="admin-form-section admin-order-contact">
            <div className="admin-form-heading"><div><p className="admin-kicker">Customer</p><h2>{order.firstName} {order.lastName}</h2></div></div>
            <dl><dt>Email</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd><dt>Phone</dt><dd>{order.phone}</dd><dt>Address</dt><dd>{order.addressLine1}{order.addressLine2 ? <><br />{order.addressLine2}</> : null}<br />{order.city}, {order.region} {order.postalCode}<br />{order.countryCode}</dd>{order.customerNote ? <><dt>Customer note</dt><dd>{order.customerNote}</dd></> : null}</dl>
          </section>
          <section className="admin-form-section">
            <div className="admin-form-heading"><div><p className="admin-kicker">Fulfillment</p><h2>Order status</h2></div></div>
            <p className="admin-muted">Payment states are controlled only by verified provider results. Fulfillment advances one step at a time.</p>
            {next ? <form action={transitionOrderAction.bind(null, id, next)}><button className={`admin-button ${next === "CANCELLED" ? "admin-button-danger" : "admin-button-primary"}`} type="submit">{next === "CANCELLED" ? "Cancel unpaid order" : <>Mark {next.toLowerCase()} <ArrowRight size={15} /></>}</button></form> : <p className="admin-status">No manual transition available</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
