import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { apiError } from "@/lib/http/api";
import {
  normalizeAirwallexEvent,
  processVerifiedPaymentEvent,
  recordIgnoredWebhookEvent,
  verifyAirwallexSignature
} from "@/lib/payments/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Airwallex webhook is not configured" }, { status: 503 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 1_000_000) throw new Error("Webhook body is too large");
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-timestamp") || "";
    const signature = request.headers.get("x-signature") || "";
    if (!verifyAirwallexSignature(rawBody, timestamp, signature, secret)) {
      return NextResponse.json({ error: "Invalid Airwallex webhook signature" }, { status: 401 });
    }
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const database = getDatabase();
    const event = normalizeAirwallexEvent(payload);
    if (!event) {
      recordIgnoredWebhookEvent(database, "airwallex", String(payload.id || "unknown"), String(payload.name || "unknown"), rawBody);
      return NextResponse.json({ status: "ignored" });
    }
    return NextResponse.json({ status: processVerifiedPaymentEvent(database, event, rawBody) });
  } catch (error) {
    return apiError(error, "Airwallex webhook processing failed");
  }
}
