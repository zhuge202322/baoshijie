type PayPalEnvironment = "sandbox" | "live";

type PayPalClientOptions = {
  clientId: string;
  clientSecret: string;
  environment: PayPalEnvironment;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
};

export class PaymentProviderError extends Error {
  readonly status: number;
  readonly providerCode: string;

  constructor(message: string, status = 502, providerCode = "PAYPAL_ERROR") {
    super(message);
    this.name = "PaymentProviderError";
    this.status = status;
    this.providerCode = providerCode;
  }
}

function amountFromCents(cents: number) {
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("PayPal amount must use positive integer cents");
  return (cents / 100).toFixed(2);
}

function centsFromAmount(value: unknown) {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) throw new PaymentProviderError("PayPal returned an invalid amount");
  const [dollars, fraction] = value.split(".");
  const cents = Number(dollars) * 100 + Number(fraction);
  if (!Number.isSafeInteger(cents)) throw new PaymentProviderError("PayPal returned an invalid amount");
  return cents;
}

export function createPayPalClient(options: PayPalClientOptions) {
  if (!options.clientId || !options.clientSecret) throw new Error("PayPal credentials are not configured");
  const baseUrl = options.environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const fetchFn = options.fetchFn || fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;

  async function request(path: string, init: RequestInit) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchFn(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) throw new PaymentProviderError("PayPal request timed out", 504, "PAYPAL_TIMEOUT");
      throw new PaymentProviderError(error instanceof Error ? error.message : "PayPal request failed");
    } finally {
      clearTimeout(timer);
    }
  }

  async function readJson(response: Response) {
    let payload: Record<string, unknown> = {};
    try {
      payload = await response.json() as Record<string, unknown>;
    } catch {
      if (!response.ok) throw new PaymentProviderError("PayPal returned an unreadable error", response.status);
    }
    if (!response.ok) {
      throw new PaymentProviderError(
        typeof payload.message === "string" ? payload.message : "PayPal rejected the request",
        response.status,
        typeof payload.name === "string" ? payload.name : "PAYPAL_ERROR"
      );
    }
    return payload;
  }

  async function accessToken() {
    const response = await request("/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${options.clientId}:${options.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    const payload = await readJson(response);
    if (typeof payload.access_token !== "string") throw new PaymentProviderError("PayPal OAuth response is invalid");
    return payload.access_token;
  }

  async function authorizedJson(path: string, idempotencyKey: string, body?: unknown) {
    const token = await accessToken();
    const response = await request(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": idempotencyKey,
        Prefer: "return=representation"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return readJson(response);
  }

  return {
    async createOrder(input: { orderId: string; orderNumber: string; totalCents: number; idempotencyKey: string }) {
      const payload = await authorizedJson("/v2/checkout/orders", input.idempotencyKey, {
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: input.orderId,
          custom_id: input.orderNumber,
          amount: { currency_code: "USD", value: amountFromCents(input.totalCents) }
        }]
      });
      if (typeof payload.id !== "string" || typeof payload.status !== "string") {
        throw new PaymentProviderError("PayPal create-order response is invalid");
      }
      const links = Array.isArray(payload.links) ? payload.links as Array<Record<string, unknown>> : [];
      const approval = links.find((link) => link.rel === "approve");
      return {
        providerOrderId: payload.id,
        status: payload.status,
        approvalUrl: typeof approval?.href === "string" ? approval.href : ""
      };
    },

    async captureOrder(providerOrderId: string, idempotencyKey: string) {
      const payload = await authorizedJson(
        `/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`,
        idempotencyKey,
        {}
      );
      const units = Array.isArray(payload.purchase_units) ? payload.purchase_units as Array<Record<string, unknown>> : [];
      const payments = units[0]?.payments as Record<string, unknown> | undefined;
      const captures = Array.isArray(payments?.captures) ? payments.captures as Array<Record<string, unknown>> : [];
      const capture = captures[0];
      const amount = capture?.amount as Record<string, unknown> | undefined;
      if (typeof payload.id !== "string" || !capture || typeof capture.id !== "string" || typeof capture.status !== "string") {
        throw new PaymentProviderError("PayPal capture response is invalid");
      }
      const providerStatus = capture.status.toUpperCase();
      return {
        providerOrderId: payload.id,
        captureId: capture.id,
        status: providerStatus === "COMPLETED" ? "completed" as const : providerStatus === "PENDING" ? "pending" as const : "failed" as const,
        amountCents: centsFromAmount(amount?.value),
        currency: String(amount?.currency_code || "")
      };
    },

    async verifyWebhookSignature(input: {
      webhookId: string;
      transmissionId: string;
      transmissionTime: string;
      transmissionSignature: string;
      certUrl: string;
      authAlgorithm: string;
      webhookEvent: Record<string, unknown>;
    }) {
      const token = await accessToken();
      const response = await request("/v1/notifications/verify-webhook-signature", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_algo: input.authAlgorithm,
          cert_url: input.certUrl,
          transmission_id: input.transmissionId,
          transmission_sig: input.transmissionSignature,
          transmission_time: input.transmissionTime,
          webhook_id: input.webhookId,
          webhook_event: input.webhookEvent
        })
      });
      const payload = await readJson(response);
      return payload.verification_status === "SUCCESS";
    }
  };
}

export function getPayPalClientFromEnv() {
  return createPayPalClient({
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    environment: process.env.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox"
  });
}
