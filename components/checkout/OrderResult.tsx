"use client";

import Link from "next/link";
import { CheckCircle2, CircleX, Clock3, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatUsd } from "@/lib/catalog/model";
import { classifyOrderResult, shouldClearCartForOrder } from "@/lib/orders/result";
import type { OrderStatus } from "@/lib/orders/transitions";

type PrivateOrderStatus = {
  orderNumber: string;
  status: OrderStatus;
  paymentProvider: "paypal" | "airwallex";
  currency: "USD";
  totalCents: number;
  paidAt: number | null;
  createdAt: number;
};

export function OrderResult({ orderNumber, token }: { orderNumber: string; token: string }) {
  const { clear } = useCart();
  const [order, setOrder] = useState<PrivateOrderStatus | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(true);

  const refresh = useCallback(async () => {
    if (!orderNumber || !token) {
      setError("This order link is incomplete.");
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const body = await response.json() as PrivateOrderStatus & { error?: string };
      if (!response.ok) throw new Error(body.error || "Order could not be found");
      setOrder(body);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Order status could not be loaded");
    } finally {
      setRefreshing(false);
    }
  }, [orderNumber, token]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!order || classifyOrderResult(order.status) !== "pending") return;
    const timer = window.setTimeout(() => void refresh(), 2500);
    return () => window.clearTimeout(timer);
  }, [order, refresh]);

  useEffect(() => {
    if (!order || !shouldClearCartForOrder(order.status)) return;
    const key = `baoshijie-cleared-${order.orderNumber}`;
    if (window.sessionStorage.getItem(key)) return;
    clear();
    window.sessionStorage.setItem(key, "true");
  }, [clear, order]);

  if (error) {
    return <ResultShell icon={<CircleX size={34} />} title="Order unavailable"><p className="muted">{error}</p><Link className="button primary mono" href="/checkout">Return to checkout</Link></ResultShell>;
  }
  if (!order) {
    return <ResultShell icon={<RefreshCw className="result-spin" size={32} />} title="Checking payment"><p className="muted">Securely retrieving your order status.</p></ResultShell>;
  }

  const kind = classifyOrderResult(order.status);
  if (kind === "success") {
    return <ResultShell icon={<CheckCircle2 size={38} />} title="Payment received" success>
      <p className="result-order mono">{order.orderNumber}</p>
      <p className="muted">Your order for {formatUsd(order.totalCents)} is confirmed. Our team will contact you directly to verify fitment and fulfillment details.</p>
      <Link className="button primary mono" href="/catalog">Continue shopping</Link>
    </ResultShell>;
  }
  if (kind === "pending") {
    return <ResultShell icon={<Clock3 size={38} />} title="Payment processing">
      <p className="result-order mono">{order.orderNumber}</p>
      <p className="muted">The payment provider is still confirming this transaction. This page updates automatically.</p>
      <button className="button ghost mono" type="button" onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={16} /> Refresh status</button>
    </ResultShell>;
  }
  if (kind === "failed") {
    return <ResultShell icon={<CircleX size={38} />} title="Payment not completed">
      <p className="result-order mono">{order.orderNumber}</p>
      <p className="muted">No successful payment was recorded. Your cart is unchanged and you can try checkout again.</p>
      <Link className="button primary mono" href="/checkout"><RotateCcw size={16} /> Try again</Link>
    </ResultShell>;
  }
  return <ResultShell icon={<CircleX size={38} />} title={kind === "refunded" ? "Order refunded" : "Order cancelled"}>
    <p className="result-order mono">{order.orderNumber}</p>
    <p className="muted">Contact customer service and quote this order number if you need assistance.</p>
    <Link className="button primary mono" href="/#contact-us">Contact us</Link>
  </ResultShell>;
}

function ResultShell({ icon, title, children, success = false }: { icon: React.ReactNode; title: string; children: React.ReactNode; success?: boolean }) {
  return <div className={`container section order-result ${success ? "is-success" : ""}`}><span className="order-result-icon">{icon}</span><p className="eyebrow">Order status</p><h1 className="headline">{title}</h1>{children}</div>;
}
