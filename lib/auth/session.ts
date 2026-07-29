import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;

export const ADMIN_SESSION_COOKIE = "baoshijie_admin";
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

export type AdminSession = {
  username: string;
  issuedAt: number;
  expiresAt: number;
};

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

export function safeEqualText(left: string, right: string) {
  return safeEqual(Buffer.from(left), Buffer.from(right));
}

export function createPasswordHash(password: string, salt = randomBytes(16)) {
  if (password.length < 12) throw new Error("Administrator password must contain at least 12 characters");
  const derived = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), derived.toString("base64url")].join("$");
}

export function verifyPassword(password: string, encodedHash: string) {
  try {
    const [algorithm, nValue, rValue, pValue, saltValue, hashValue] = encodedHash.split("$");
    if (algorithm !== "scrypt" || !nValue || !rValue || !pValue || !saltValue || !hashValue) return false;
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(hashValue, "base64url");
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(nValue),
      r: Number(rValue),
      p: Number(pValue),
      maxmem: 64 * 1024 * 1024
    });
    return safeEqual(actual, expected);
  } catch {
    return false;
  }
}

function sign(value: string, secret: string) {
  if (secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(
  username: string,
  secret: string,
  options: { now?: number; ttlMs?: number } = {}
) {
  const now = options.now ?? Date.now();
  const payload: SessionPayload = {
    sub: username,
    iat: now,
    exp: now + (options.ttlMs ?? ADMIN_SESSION_TTL_MS)
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifySessionToken(token: string, secret: string, now = Date.now()): AdminSession | null {
  try {
    const [encoded, signature, extra] = token.split(".");
    if (!encoded || !signature || extra) return null;
    if (!safeEqual(Buffer.from(signature), Buffer.from(sign(encoded, secret)))) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.sub !== "string" || !Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) return null;
    if (payload.iat > now + 60_000 || payload.exp <= now || payload.exp <= payload.iat) return null;
    return { username: payload.sub, issuedAt: payload.iat, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt)
  };
}
