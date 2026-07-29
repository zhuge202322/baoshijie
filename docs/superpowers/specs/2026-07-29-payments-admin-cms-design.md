# Payments and Admin CMS Design

## Scope

Build a single-server commerce backend for the existing Next.js storefront. The release adds guest checkout through Airwallex and PayPal, SQLite order persistence, a single-administrator CMS, local image uploads, and order management. Payment credentials remain environment variables and can be supplied after the implementation is deployed to a staging server.

## Confirmed Business Rules

- Currency is USD only.
- Tax is never charged or displayed.
- Order total is product subtotal plus one fixed shipping option.
- Shipping options are Standard Shipping at USD 12 and Premium Expedited Air at USD 45.
- Supported destinations are the United States, Canada, the 27 EU member states, the United Kingdom, Norway, Switzerland, Iceland, and Liechtenstein.
- Checkout is guest-only. Required customer data includes email, phone, full name, country, region/state where applicable, city, postal code, address line 1, and optional address line 2.
- Payments are captured immediately.
- No transactional email is sent. Staff contact customers manually.
- One administrator account is configured through server environment variables. There is no administrator registration flow.

## Architecture

The application runs as one Node.js Next.js instance on an independent server with a persistent disk. SQLite is accessed through Drizzle ORM and `better-sqlite3`; WAL mode and foreign keys are enabled at startup. Database and uploads live outside build artifacts under configurable persistent paths.

All prices are recalculated on the server from active database products. Client totals are display-only. Provider-specific code sits behind payment adapters so Airwallex and PayPal cannot leak provider details into order calculations or the CMS.

The public storefront reads categories, products, settings, social links, and page images from SQLite. Initial seed data reproduces the current hard-coded site so enabling the database does not empty the storefront.

## Data Model

### Catalog and content

- `categories`: name, slug, description, sort order, active flag, timestamps.
- `products`: category reference, slug, name, part number, product type, material, USD price in cents, image URL, short and full descriptions, compatibility JSON, specifications JSON, badge, inventory status, active flag, timestamps.
- `site_settings`: singleton values for website name, company logo URL, support email, support phone, support WhatsApp, and company address.
- `social_links`: platform, label, URL, sort order, active flag.
- `media_slots`: stable slot key, page, section label, image URL, alt text, sort order, timestamps. Slots cover every existing image-bearing section and Hero slide.
- `media_assets`: uploaded file metadata, public URL, MIME type, size, timestamps.

Products are archived rather than physically deleted after they have appeared in an order. This preserves immutable order history while satisfying storefront removal. Categories with products cannot be deleted until products are moved or archived.

### Orders and payments

- `orders`: public order number, private lookup token hash, status, payment provider, currency, subtotal/shipping/total cents, shipping method, customer contact, shipping address, customer note, provider references, timestamps.
- `order_items`: immutable product snapshot including product ID, slug, part number, name, quantity, and unit/line prices.
- `payments`: provider, provider payment/order ID, status, amount, currency, provider response metadata, timestamps.
- `webhook_events`: provider event ID, event type, payload hash, processing status, processed timestamp. Unique provider event IDs provide idempotency.

Order states are `PENDING_PAYMENT`, `PAYMENT_PROCESSING`, `PAID`, `PAYMENT_FAILED`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `CANCELLED`, and `REFUNDED`. Provider callbacks control payment states; administrators control fulfillment states. Version one does not initiate refunds from the CMS.

## Authentication and Security

The login form posts credentials to a Node runtime route. The username is compared with a timing-safe comparison and the password is verified against `ADMIN_PASSWORD_HASH`. A signed, HttpOnly, Secure, SameSite=Lax session cookie contains issuance and expiry times. All `/admin` pages and `/api/admin/*` routes verify the cookie independently.

Mutation routes validate data with Zod and enforce same-origin requests. Login attempts receive a lightweight in-memory/IP rate limit suitable for one process. Uploaded files accept JPEG, PNG, WebP, or AVIF only, enforce a 10 MB limit, use generated names, and reject path traversal. Card and PayPal credentials never pass through or persist in this application.

## CMS Experience

The admin shell contains Dashboard, Orders, Products, Categories, Site Settings, Page Images, and Social Links.

- Dashboard shows paid/pending orders, revenue, and recent orders.
- Orders supports search, status filters, detail inspection, internal notes, and fulfillment status updates.
- Products supports create, edit, archive/restore, image selection/upload, and a compact price editor.
- Categories supports create, edit, ordering, activation, and safe deletion.
- Site Settings edits website name, logo, and customer-service contact details.
- Page Images groups stable image slots by page and supports replace, alt text edit, and restore-to-seeded URL.
- Social Links supports create, edit, ordering, activation, and deletion.

## Checkout and Payment Flow

1. The checkout page validates contact, destination, address, shipping option, cart quantities, and payment provider.
2. `POST /api/checkout/orders` re-reads products, calculates cents, saves a pending order and immutable items, then creates the provider payment resource.
3. Airwallex returns an ephemeral PaymentIntent client secret to its hosted web component. PayPal returns an Orders v2 order ID to PayPal Buttons.
4. The browser completes provider-hosted authentication. PayPal capture is requested by the server; Airwallex completion is confirmed by the provider component and webhook.
5. Verified webhooks are idempotently stored and update payment/order state. Browser success is not treated as the source of truth.
6. The result page uses the order number plus a private lookup token and polls a read-only order status endpoint. On `PAID`, the local cart is cleared and the customer sees the order number and contact expectation.
7. Failures keep the order and allow a new payment attempt without duplicating order items.

## Media Storage and Deployment

`DATABASE_PATH` points to a persistent SQLite file and `UPLOAD_DIR` points to a persistent upload directory. A public media route serves uploaded assets with immutable cache headers after safe path validation. Production deployment must mount both locations outside the application release directory and back them up together.

Provider and admin secrets are documented in `.env.example`, never committed with values. Missing payment keys disable that provider and show an unavailable state instead of crashing the checkout.

## Testing

- Unit tests cover money calculation, destination validation, order transitions, session signing, and provider payload mapping.
- Route tests cover unauthorized admin access, server-side price recalculation, invalid carts, webhook idempotency, and CMS validation.
- Browser tests cover admin login/CRUD, fixed-shipping guest checkout, provider-unavailable states, successful mocked callbacks, cart clearing, and responsive checkout/admin layouts.
- Production build and migration/seed commands run without payment keys.

## Non-Goals

- Customer accounts, customer login, wishlists, coupons, tax calculation, dynamic carrier rates, transactional email, multiple administrators, horizontal multi-instance deployment, and CMS-initiated refunds are outside this release.
