import { NextResponse } from "next/server";

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin !== new URL(request.url).origin);
}

export function apiError(error: unknown, fallback = "Request could not be completed", status = 400) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status });
}

export async function readJsonBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 100_000) throw new Error("Request body is too large");
  return request.json() as Promise<Record<string, unknown>>;
}
