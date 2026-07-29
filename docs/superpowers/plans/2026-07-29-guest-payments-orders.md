# Guest Payments and Orders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guest USD checkout with fixed shipping, immediate Airwallex/PayPal capture, verified webhooks, result handling, and admin order management.

**Architecture:** A provider-neutral checkout service creates immutable pending orders after server-side repricing. Airwallex and PayPal adapters create/capture provider resources; verified idempotent webhooks are the authoritative payment-state source.

**Tech Stack:** Next.js route handlers, Drizzle/SQLite transactions, Zod, Airwallex hosted web components, PayPal JavaScript SDK and Orders v2 REST API, Vitest, Playwright.

---

### Task 1: Define checkout policy and order transitions

**Files:**
- Create: `lib/checkout/policy.ts`
- Create: `lib/orders/transitions.ts`
- Create: `tests/checkout/policy.test.ts`
- Create: `tests/orders/transitions.test.ts`

- [ ] Write failing tests for USD-only cents calculation, USD 12/USD 45 shipping, no tax, destination whitelist, quantity bounds, and legal/illegal order transitions.
- [ ] Confirm expected failures and implement pure policy/transition functions.
- [ ] Run focused tests and confirm all cases pass.

### Task 2: Create provider-neutral orders

**Files:**
- Create: `lib/checkout/create-order.ts`
- Create: `app/api/checkout/orders/route.ts`
- Create: `tests/checkout/create-order.test.ts`

- [ ] Write failing tests proving browser prices are ignored, inactive products fail, empty carts fail, address requirements vary by destination, and immutable item snapshots are stored atomically.
- [ ] Implement server-side product lookup, totals, private lookup-token hashing, order number generation, and transaction rollback.
- [ ] Return only order number, one-time lookup token, calculated totals, and provider initialization data.

### Task 3: Implement PayPal adapter

**Files:**
- Create: `lib/payments/types.ts`
- Create: `lib/payments/paypal.ts`
- Create: `app/api/payments/paypal/orders/route.ts`
- Create: `app/api/payments/paypal/capture/route.ts`
- Create: `tests/payments/paypal.test.ts`

- [ ] Write failing tests for OAuth token acquisition, Orders v2 USD payload mapping, idempotency headers, capture result mapping, provider errors, and timeout behavior using an injected fetch function.
- [ ] Implement sandbox/live base URLs and server-only credentials.
- [ ] Verify all PayPal adapter and route tests pass without live keys.

### Task 4: Implement Airwallex adapter

**Files:**
- Create: `lib/payments/airwallex.ts`
- Create: `app/api/payments/airwallex/intents/route.ts`
- Create: `tests/payments/airwallex.test.ts`

- [ ] Write failing tests for API authentication, PaymentIntent USD payload mapping, merchant order references, client-secret projection, provider errors, and timeout behavior.
- [ ] Implement demo/production endpoints with server-only API key and client ID.
- [ ] Verify adapter and route tests pass without live keys.

### Task 5: Verify and process webhooks

**Files:**
- Create: `lib/payments/webhooks.ts`
- Create: `app/api/webhooks/paypal/route.ts`
- Create: `app/api/webhooks/airwallex/route.ts`
- Create: `tests/payments/webhooks.test.ts`

- [ ] Write failing tests for PayPal verification API mapping, Airwallex signature/timestamp verification, stale signatures, duplicate event IDs, wrong amounts/currencies, and transactional state updates.
- [ ] Implement raw-body verification before JSON processing and persist event IDs before state changes.
- [ ] Map completed/captured/failed/cancelled/refunded events into legal order/payment transitions.
- [ ] Re-run duplicate and invalid-signature tests and confirm no order mutation occurs.

### Task 6: Replace the mock checkout UI

**Files:**
- Modify: `components/CheckoutClient.tsx`
- Create: `components/checkout/AddressForm.tsx`
- Create: `components/checkout/PaymentSelector.tsx`
- Create: `components/checkout/PayPalCheckout.tsx`
- Create: `components/checkout/AirwallexCheckout.tsx`
- Create: `lib/checkout/countries.ts`

- [ ] Add a browser test for required guest fields, supported-country options, two fixed shipping choices, no tax text, empty-cart handling, and keyboard-accessible payment selection.
- [ ] Confirm the current fake-card form fails the test.
- [ ] Implement controlled validation, server-calculated summary refresh, provider unavailable states, duplicate-submit prevention, and hosted provider controls.
- [ ] Verify card data is never rendered into application-owned inputs or sent to application routes.

### Task 7: Add order result and retry flow

**Files:**
- Create: `app/checkout/result/page.tsx`
- Create: `components/checkout/OrderResult.tsx`
- Create: `app/api/orders/[orderNumber]/route.ts`
- Modify: `components/CartProvider.tsx`
- Create: `tests/orders/result.test.ts`

- [ ] Write failing tests for valid/invalid lookup tokens, pending polling, paid result, failed retry eligibility, and one-time cart clearing.
- [ ] Implement minimal private status projection and result states.
- [ ] Confirm that a browser redirect alone cannot mark an order paid.

### Task 8: Build admin order management

**Files:**
- Create: `app/admin/(protected)/orders/page.tsx`
- Create: `app/admin/(protected)/orders/[id]/page.tsx`
- Create: `app/admin/actions/orders.ts`
- Create: `tests/admin/order-actions.test.ts`

- [ ] Write failing tests for auth, search/filter, detail snapshots, internal notes, legal fulfillment transitions, and protection of provider-controlled payment status.
- [ ] Implement order table, detail page, payment timeline, customer/shipping data, notes, and fulfillment status updates.
- [ ] Browser-test responsive order management and destructive-action confirmations.

### Task 9: Document provider setup and verify end to end

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Create: `qa/payment-smoke.spec.ts`

- [ ] Document Airwallex demo/live and PayPal sandbox/live variables plus webhook URLs.
- [ ] Run all unit/route tests with deterministic mocked provider responses.
- [ ] Run browser smoke tests for PayPal success, Airwallex success, provider failure, duplicate webhook, and order fulfillment.
- [ ] Run `pnpm typecheck` and `pnpm build` with no provider keys and confirm both providers render unavailable without build failure.
