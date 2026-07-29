import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { apiError, readJsonBody, rejectCrossOrigin } from "@/lib/http/api";
import { createPaymentAttempt, markOrderPaymentProcessing, verifyOrderLookup } from "@/lib/orders/repository";
import { getPayPalClientFromEnv, PaymentProviderError } from "@/lib/payments/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (rejectCrossOrigin(request)) return apiError(new Error("Invalid request origin"), "", 403);
  try {
    const body = await readJsonBody(request);
    const database = getDatabase();
    const order = verifyOrderLookup(database, String(body.orderNumber || ""), String(body.lookupToken || ""));
    if (!order) return apiError(new Error("Order not found"), "", 404);
    if (order.paymentProvider !== "paypal") return apiError(new Error("Order does not use PayPal"), "", 409);
    markOrderPaymentProcessing(database, order.id, "paypal");
    const result = await getPayPalClientFromEnv().createOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      idempotencyKey: `paypal-create-${order.id}`
    });
    createPaymentAttempt(database, {
      id: `payment-${randomUUID()}`,
      orderId: order.id,
      provider: "paypal",
      providerPaymentId: result.providerOrderId,
      status: result.status,
      amountCents: order.totalCents,
      currency: "USD",
      metadata: { approvalUrl: result.approvalUrl }
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, "PayPal could not be initialized", error instanceof PaymentProviderError ? error.status : 400);
  }
}
