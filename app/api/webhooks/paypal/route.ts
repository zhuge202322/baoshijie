import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { apiError } from "@/lib/http/api";
import { getPayPalClientFromEnv, PaymentProviderError } from "@/lib/payments/paypal";
import { normalizePayPalEvent, processVerifiedPaymentEvent, recordIgnoredWebhookEvent } from "@/lib/payments/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return NextResponse.json({ error: "PayPal webhook is not configured" }, { status: 503 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 1_000_000) throw new Error("Webhook body is too large");
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const header = (name: string) => request.headers.get(name) || "";
    const valid = await getPayPalClientFromEnv().verifyWebhookSignature({
      webhookId,
      transmissionId: header("paypal-transmission-id"),
      transmissionTime: header("paypal-transmission-time"),
      transmissionSignature: header("paypal-transmission-sig"),
      certUrl: header("paypal-cert-url"),
      authAlgorithm: header("paypal-auth-algo"),
      webhookEvent: payload
    });
    if (!valid) return NextResponse.json({ error: "Invalid PayPal webhook signature" }, { status: 401 });

    const database = getDatabase();
    const event = normalizePayPalEvent(payload);
    if (!event) {
      recordIgnoredWebhookEvent(database, "paypal", String(payload.id || "unknown"), String(payload.event_type || "unknown"), rawBody);
      return NextResponse.json({ status: "ignored" });
    }
    return NextResponse.json({ status: processVerifiedPaymentEvent(database, event, rawBody) });
  } catch (error) {
    return apiError(error, "PayPal webhook processing failed", error instanceof PaymentProviderError ? error.status : 400);
  }
}
