import type { Metadata } from "next";
import { OrderResult } from "@/components/checkout/OrderResult";

export const metadata: Metadata = {
  title: "Order Status | Bespoke Elemental",
  robots: { index: false, follow: false },
  referrer: "no-referrer"
};

export default async function CheckoutResultPage({ searchParams }: { searchParams: Promise<{ order?: string; token?: string }> }) {
  const { order = "", token = "" } = await searchParams;
  return <main><OrderResult orderNumber={order} token={token} /></main>;
}
