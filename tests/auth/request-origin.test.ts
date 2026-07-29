import assert from "node:assert/strict";
import test from "node:test";
import { getPublicRequestOrigin, hasValidRequestOrigin } from "../../lib/auth/request-origin.ts";

function request(url: string, headers: Record<string, string> = {}) {
  const normalized = new Map(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    url,
    headers: { get: (name: string) => normalized.get(name.toLowerCase()) || null }
  };
}

test("same-origin validation uses the public Host header on custom ports", () => {
  const customPortRequest = request("http://localhost:3000/api/admin/session", {
    host: "127.0.0.1:3014",
    origin: "http://127.0.0.1:3014"
  });
  assert.equal(hasValidRequestOrigin(customPortRequest), true);
  assert.equal(getPublicRequestOrigin(customPortRequest), "http://127.0.0.1:3014");
});

test("same-origin validation supports HTTPS terminated by a trusted reverse proxy", () => {
  const proxiedRequest = request("http://127.0.0.1:3000/api/admin/session", {
    host: "parts.example.com",
    origin: "https://parts.example.com",
    "x-forwarded-proto": "https"
  });
  assert.equal(hasValidRequestOrigin(proxiedRequest), true);
  assert.equal(getPublicRequestOrigin(proxiedRequest), "https://parts.example.com");
});

test("same-origin validation rejects foreign, downgraded, and malformed origins", () => {
  const baseHeaders = { host: "parts.example.com", "x-forwarded-proto": "https" };
  assert.equal(hasValidRequestOrigin(request("http://127.0.0.1:3000/api/admin/session", {
    ...baseHeaders,
    origin: "https://attacker.example"
  })), false);
  assert.equal(hasValidRequestOrigin(request("http://127.0.0.1:3000/api/admin/session", {
    ...baseHeaders,
    origin: "http://parts.example.com"
  })), false);
  assert.equal(hasValidRequestOrigin(request("http://127.0.0.1:3000/api/admin/session", {
    ...baseHeaders,
    origin: "not a URL"
  })), false);
});

test("requests without an Origin header retain non-browser compatibility", () => {
  assert.equal(hasValidRequestOrigin(request("http://127.0.0.1:3000/api/admin/session", {
    host: "127.0.0.1:3000"
  })), true);
});
