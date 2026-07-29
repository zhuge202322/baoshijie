export function getPublicPaymentConfig() {
  return {
    paypal: {
      available: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      clientId: process.env.PAYPAL_CLIENT_ID || "",
      environment: process.env.PAYPAL_ENVIRONMENT === "live" ? "live" as const : "sandbox" as const
    },
    airwallex: {
      available: Boolean(process.env.AIRWALLEX_CLIENT_ID && process.env.AIRWALLEX_API_KEY),
      environment: process.env.AIRWALLEX_ENVIRONMENT === "production" ? "production" as const : "demo" as const
    }
  };
}
