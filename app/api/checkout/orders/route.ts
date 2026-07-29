import { NextResponse } from "next/server";
import { createGuestOrder, type GuestOrderInput } from "@/lib/checkout/create-order";
import { getDatabase } from "@/lib/db/client";
import { apiError, readJsonBody, rejectCrossOrigin } from "@/lib/http/api";
import { getPublicPaymentConfig } from "@/lib/payments/config";
import { LoginRateLimiter } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

const checkoutRateLimiter = new LoginRateLimiter({ maxAttempts: 20, windowMs: 15 * 60 * 1000 });

export async function POST(request: Request) {
  if (rejectCrossOrigin(request)) return apiError(new Error("Invalid request origin"), "", 403);
  try {
    const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "local";
    const limit = checkoutRateLimiter.consume(clientKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Try again later.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }
    const body = await readJsonBody(request) as unknown as GuestOrderInput;
    const config = getPublicPaymentConfig();
    if (!config[body.paymentProvider]?.available) {
      return NextResponse.json({ error: "Selected payment provider is not configured", code: "PROVIDER_UNAVAILABLE" }, { status: 503 });
    }
    const order = createGuestOrder(getDatabase(), body);
    return NextResponse.json({
      orderNumber: order.orderNumber,
      lookupToken: order.lookupToken,
      status: order.status,
      paymentProvider: order.paymentProvider,
      totals: order.totals
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
