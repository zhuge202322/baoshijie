type RequestLike = {
  url: string;
  headers: { get(name: string): string | null };
};

export function hasValidRequestOrigin(request: RequestLike) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const host = (request.headers.get("host") || requestUrl.host).trim().toLowerCase();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : requestUrl.protocol.toLowerCase();

    if (protocol !== "http:" && protocol !== "https:") return false;
    return originUrl.host.toLowerCase() === host && originUrl.protocol.toLowerCase() === protocol;
  } catch {
    return false;
  }
}

export function getPublicRequestOrigin(request: RequestLike) {
  const origin = request.headers.get("origin");
  if (origin && hasValidRequestOrigin(request)) return new URL(origin).origin;
  return new URL(request.url).origin;
}
