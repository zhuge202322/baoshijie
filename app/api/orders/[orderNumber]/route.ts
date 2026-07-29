import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/client";
import { getPrivateOrderStatus } from "@/lib/orders/repository";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  const result = getPrivateOrderStatus(getDatabase(), orderNumber, token);
  if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
