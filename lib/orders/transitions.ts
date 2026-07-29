export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PAID"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "CANCELLED"
  | "REFUNDED";

export type TransitionActor = "payment" | "admin";

const paymentTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_PAYMENT: ["PAYMENT_PROCESSING", "PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_PROCESSING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "PAID", "CANCELLED"],
  PAID: ["REFUNDED"],
  CONFIRMED: ["REFUNDED"],
  PROCESSING: ["REFUNDED"],
  SHIPPED: ["REFUNDED"]
};

const adminTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_FAILED: ["CANCELLED"],
  PAID: ["CONFIRMED"],
  CONFIRMED: ["PROCESSING"],
  PROCESSING: ["SHIPPED"]
};

export function canTransitionOrder(current: OrderStatus, next: OrderStatus, actor: TransitionActor) {
  if (current === next) return true;
  const transitions = actor === "payment" ? paymentTransitions : adminTransitions;
  return transitions[current]?.includes(next) || false;
}

export function assertOrderTransition(current: OrderStatus, next: OrderStatus, actor: TransitionActor) {
  if (!canTransitionOrder(current, next, actor)) {
    throw new Error(`Order transition from ${current} to ${next} is not allowed for ${actor}`);
  }
}
