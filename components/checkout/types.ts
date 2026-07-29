export type PaymentConfig = {
  paypal: { available: boolean; clientId: string; environment: "sandbox" | "live" };
  airwallex: { available: boolean; environment: "demo" | "production" };
};

export type CheckoutSession = {
  orderNumber: string;
  lookupToken: string;
  status: "PENDING_PAYMENT";
  paymentProvider: "paypal" | "airwallex";
  totals: {
    currency: "USD";
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
  };
};
