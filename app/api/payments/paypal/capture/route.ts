import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { apiError, readJsonBody, rejectCrossOrigin } from "@/lib/http/api";
import { applyPaymentResult, verifyOrderLookup } from "@/lib/orders/repository";
import { getPayPalClientFromEnv, PaymentProviderError } from "@/lib/payments/paypal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (rejectCrossOrigin(request)) return apiError(new Error("Invalid request origin"), "", 403);
  try {
    const body = await readJsonBody(request);
    const database = getDatabase();
    const order = verifyOrderLookup(database, String(body.orderNumber || ""), String(body.lookupToken || ""));
    if (!order) return apiError(new Error("Order not found"), "", 404);
    const providerOrderId = String(body.providerOrderId || "");
    if (order.paymentProvider !== "paypal" || !providerOrderId || order.providerReference !== providerOrderId) {
      return apiError(new Error("PayPal order does not match local order"), "", 409);
    }
    if (order.status !== "PAYMENT_PROCESSING") return apiError(new Error("Order is not awaiting payment"), "", 409);
    const result = await getPayPalClientFromEnv().captureOrder(providerOrderId, `paypal-capture-${order.id}`);
    applyPaymentResult(database, {
      provider: "paypal",
      providerPaymentId: providerOrderId,
      status: result.status,
      amountCents: result.amountCents,
      currency: result.currency,
      metadata: { captureId: result.captureId }
    });
    return NextResponse.json({ status: result.status });
  } catch (error) {
    return apiError(error, "PayPal capture failed", error instanceof PaymentProviderError ? error.status : 400);
  }
}
