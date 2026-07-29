import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { apiError, readJsonBody, rejectCrossOrigin } from "@/lib/http/api";
import { createPaymentAttempt, markOrderPaymentProcessing, verifyOrderLookup } from "@/lib/orders/repository";
import { getAirwallexClientFromEnv, PaymentProviderError } from "@/lib/payments/airwallex";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (rejectCrossOrigin(request)) return apiError(new Error("Invalid request origin"), "", 403);
  try {
    const body = await readJsonBody(request);
    const database = getDatabase();
    const order = verifyOrderLookup(database, String(body.orderNumber || ""), String(body.lookupToken || ""));
    if (!order) return apiError(new Error("Order not found"), "", 404);
    if (order.paymentProvider !== "airwallex") return apiError(new Error("Order does not use Airwallex"), "", 409);
    markOrderPaymentProcessing(database, order.id, "airwallex");
    const result = await getAirwallexClientFromEnv().createPaymentIntent({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      idempotencyKey: `airwallex-intent-${order.id}`
    });
    if (result.amountCents !== order.totalCents || result.currency !== "USD") {
      return apiError(new Error("Airwallex intent does not match local order"), "", 409);
    }
    createPaymentAttempt(database, {
      id: `payment-${randomUUID()}`,
      orderId: order.id,
      provider: "airwallex",
      providerPaymentId: result.paymentIntentId,
      status: result.status,
      amountCents: order.totalCents,
      currency: "USD",
      metadata: {}
    });
    return NextResponse.json({
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      status: result.status,
      environment: process.env.AIRWALLEX_ENVIRONMENT === "production" ? "production" : "demo"
    });
  } catch (error) {
    return apiError(error, "Airwallex could not be initialized", error instanceof PaymentProviderError ? error.status : 400);
  }
}
