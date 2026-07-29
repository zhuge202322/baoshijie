type AirwallexEnvironment = "demo" | "production";

type AirwallexClientOptions = {
  clientId: string;
  apiKey: string;
  environment: AirwallexEnvironment;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
};

export class PaymentProviderError extends Error {
  readonly status: number;
  readonly providerCode: string;

  constructor(message: string, status = 502, providerCode = "AIRWALLEX_ERROR") {
    super(message);
    this.name = "PaymentProviderError";
    this.status = status;
    this.providerCode = providerCode;
  }
}

function amountFromCents(cents: number) {
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Airwallex amount must use positive integer cents");
  return Number((cents / 100).toFixed(2));
}

function centsFromAmount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new PaymentProviderError("Airwallex returned an invalid amount");
  }
  const cents = Math.round(value * 100);
  if (Math.abs(cents / 100 - value) > 0.000001 || !Number.isSafeInteger(cents)) {
    throw new PaymentProviderError("Airwallex returned an invalid amount");
  }
  return cents;
}

export function createAirwallexClient(options: AirwallexClientOptions) {
  if (!options.clientId || !options.apiKey) throw new Error("Airwallex credentials are not configured");
  const baseUrl = options.environment === "production" ? "https://api.airwallex.com" : "https://api-demo.airwallex.com";
  const fetchFn = options.fetchFn || fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;

  async function request(path: string, init: RequestInit) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchFn(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) throw new PaymentProviderError("Airwallex request timed out", 504, "AIRWALLEX_TIMEOUT");
      throw new PaymentProviderError(error instanceof Error ? error.message : "Airwallex request failed");
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson(response: Response) {
    let payload: Record<string, unknown> = {};
    try {
      payload = await response.json() as Record<string, unknown>;
    } catch {
      if (!response.ok) throw new PaymentProviderError("Airwallex returned an unreadable error", response.status);
    }
    if (!response.ok) {
      throw new PaymentProviderError(
        typeof payload.message === "string" ? payload.message : "Airwallex rejected the request",
        response.status,
        typeof payload.code === "string" ? payload.code : "AIRWALLEX_ERROR"
      );
    }
    return payload;
  }

  async function accessToken() {
    const response = await request("/api/v1/authentication/login", {
      method: "POST",
      headers: { "x-client-id": options.clientId, "x-api-key": options.apiKey }
    });
    const payload = await readJson(response);
    if (typeof payload.token !== "string") throw new PaymentProviderError("Airwallex authentication response is invalid");
    return payload.token;
  }

  return {
    async createPaymentIntent(input: { orderId: string; orderNumber: string; totalCents: number; idempotencyKey: string }) {
      const token = await accessToken();
      const response = await request("/api/v1/pa/payment_intents/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-idempotency-key": input.idempotencyKey
        },
        body: JSON.stringify({
          request_id: input.idempotencyKey,
          amount: amountFromCents(input.totalCents),
          currency: "USD",
          merchant_order_id: input.orderNumber,
          capture_method: "AUTOMATIC",
          metadata: { order_id: input.orderId }
        })
      });
      const payload = await readJson(response);
      if (typeof payload.id !== "string" || typeof payload.client_secret !== "string" || typeof payload.status !== "string") {
        throw new PaymentProviderError("Airwallex PaymentIntent response is invalid");
      }
      const currency = String(payload.currency || "");
      if (currency !== "USD") throw new PaymentProviderError("Airwallex returned an invalid currency");
      return {
        paymentIntentId: payload.id,
        clientSecret: payload.client_secret,
        status: payload.status,
        amountCents: centsFromAmount(payload.amount),
        currency
      };
    }
  };
}

export function getAirwallexClientFromEnv() {
  return createAirwallexClient({
    clientId: process.env.AIRWALLEX_CLIENT_ID || "",
    apiKey: process.env.AIRWALLEX_API_KEY || "",
    environment: process.env.AIRWALLEX_ENVIRONMENT === "production" ? "production" : "demo"
  });
}
