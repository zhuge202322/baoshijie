import type { OrderStatus } from "./transitions.ts";

export type OrderResultKind = "pending" | "failed" | "success" | "cancelled" | "refunded";

export function classifyOrderResult(status: OrderStatus): OrderResultKind {
  if (status === "PENDING_PAYMENT" || status === "PAYMENT_PROCESSING") return "pending";
  if (status === "PAYMENT_FAILED") return "failed";
  if (status === "CANCELLED") return "cancelled";
  if (status === "REFUNDED") return "refunded";
  return "success";
}

export function shouldClearCartForOrder(status: OrderStatus) {
  return ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "REFUNDED"].includes(status);
}
