import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  safeEqualText,
  verifyPassword,
  verifySessionToken
} from "@/lib/auth/session";
import { adminLoginRateLimiter } from "@/lib/auth/rate-limit";
import { getPublicRequestOrigin, hasValidRequestOrigin } from "@/lib/auth/request-origin";

export const runtime = "nodejs";

function loginRedirect(request: Request, error?: string) {
  const url = new URL("/admin/login", getPublicRequestOrigin(request));
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!hasValidRequestOrigin(request)) {
    return new NextResponse("Invalid request origin", { status: 403 });
  }

  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!username || !passwordHash || !sessionSecret) {
    return loginRedirect(request, "unconfigured");
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwarded || request.headers.get("x-real-ip") || "local";
  const limit = adminLoginRateLimiter.consume(clientKey);
  if (!limit.allowed) {
    const response = loginRedirect(request, "rate-limit");
    response.headers.set("Retry-After", String(Math.ceil(limit.retryAfterMs / 1000)));
    return response;
  }

  const form = await request.formData();
  const suppliedUsername = String(form.get("username") || "");
  const suppliedPassword = String(form.get("password") || "");
  if (!safeEqualText(suppliedUsername, username) || !verifyPassword(suppliedPassword, passwordHash)) {
    return loginRedirect(request, "invalid");
  }

  adminLoginRateLimiter.reset(clientKey);
  const token = createSessionToken(username, sessionSecret);
  const session = verifySessionToken(token, sessionSecret);
  if (!session) return loginRedirect(request, "invalid");
  const response = NextResponse.redirect(new URL("/admin", getPublicRequestOrigin(request)), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions(session.expiresAt));
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
