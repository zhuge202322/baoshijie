import assert from "node:assert/strict";
import test from "node:test";
import {
  createPasswordHash,
  createSessionToken,
  verifyPassword,
  verifySessionToken
} from "../../lib/auth/session.ts";
import { LoginRateLimiter } from "../../lib/auth/rate-limit.ts";

test("scrypt password hashes verify without storing the password", () => {
  const hash = createPasswordHash("a strong admin password", Buffer.alloc(16, 7));
  assert.match(hash, /^scrypt\$/);
  assert.equal(hash.includes("a strong admin password"), false);
  assert.equal(verifyPassword("a strong admin password", hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);
});

test("signed admin sessions reject tampering and expiry", () => {
  const secret = "a-session-secret-that-is-at-least-thirty-two-bytes";
  const now = 1_800_000_000_000;
  const token = createSessionToken("owner", secret, { now, ttlMs: 60_000 });

  assert.deepEqual(verifySessionToken(token, secret, now + 30_000), {
    username: "owner",
    issuedAt: now,
    expiresAt: now + 60_000
  });
  assert.equal(verifySessionToken(`${token}x`, secret, now + 30_000), null);
  assert.equal(verifySessionToken(token, secret, now + 60_001), null);
  assert.equal(verifySessionToken(token, "another-secret-that-is-at-least-32-bytes", now), null);
});

test("login rate limiter blocks repeated attempts and resets after its window", () => {
  let now = 1000;
  const limiter = new LoginRateLimiter({ maxAttempts: 3, windowMs: 60_000, now: () => now });

  assert.equal(limiter.consume("127.0.0.1").allowed, true);
  assert.equal(limiter.consume("127.0.0.1").allowed, true);
  assert.equal(limiter.consume("127.0.0.1").allowed, true);
  assert.equal(limiter.consume("127.0.0.1").allowed, false);

  now += 60_001;
  assert.equal(limiter.consume("127.0.0.1").allowed, true);
});
