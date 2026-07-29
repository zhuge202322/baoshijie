# Bespoke Elemental Commerce

Next.js storefront and single-administrator commerce system for classic Porsche components. The application includes a SQLite catalog/CMS, guest USD checkout, fixed shipping, PayPal Orders v2, Airwallex PaymentIntent, verified webhooks, local image storage, and order management.

## Requirements

- Node.js 24 or newer
- pnpm
- A persistent writable disk for SQLite and uploaded images
- HTTPS in production

This commerce build is designed for one long-running Node.js server. Vercel's ephemeral filesystem is not suitable for the SQLite database or uploaded CMS images without replacing both storage layers with managed services.

## Local setup

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm admin:hash "replace-with-a-strong-password"
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
pnpm db:seed
pnpm dev
```

Put the generated password hash in `ADMIN_PASSWORD_HASH` and the random value in `SESSION_SECRET`. The administrator login is `/admin/login`.

The application seeds the current eight products, categories, brand defaults, social links, and page image slots idempotently. Runtime data is not committed to Git.

## Persistent paths

Set absolute production paths:

```dotenv
DATABASE_PATH=/srv/baoshijie/data/baoshijie.sqlite
UPLOAD_DIR=/srv/baoshijie/uploads
```

The process user must have read/write access to both directories. SQLite enables WAL, foreign keys, normal synchronous mode, and a five-second busy timeout.

## Payments

The store charges USD only, adds no tax, and offers fixed standard `$12.00` or expedited `$45.00` shipping. Provider secrets remain server-side. Card fields are rendered only by the hosted Airwallex component.

PayPal webhook URL:

```text
https://YOUR_DOMAIN/api/webhooks/paypal
```

Subscribe to `PAYMENT.CAPTURE.PENDING`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, and `PAYMENT.CAPTURE.REVERSED`. Put the webhook ID in `PAYPAL_WEBHOOK_ID`.

Airwallex webhook URL:

```text
https://YOUR_DOMAIN/api/webhooks/airwallex
```

Subscribe to PaymentIntent success, failure, cancellation, refund, and requires-capture events. Put the signing secret in `AIRWALLEX_WEBHOOK_SECRET`.

When credentials are absent, checkout shows both providers as unavailable and does not create an order. Start with PayPal sandbox and Airwallex demo credentials, then change `PAYPAL_ENVIRONMENT=live` and `AIRWALLEX_ENVIRONMENT=production` only after provider approval and webhook verification.

## Production build

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:seed
pnpm build
pnpm start
```

`next.config.mjs` generates `.next/standalone` for a smaller deployment. The `pnpm build` script copies `public` and `.next/static` into that package automatically, and `pnpm start` runs the prepared standalone server.

Terminate TLS at Nginx, Caddy, or another trusted reverse proxy. Forward the original host/protocol and replace client-supplied forwarding headers so login and checkout rate limits receive the real client IP.

## Backup

Back up both the database and uploads. Use SQLite's online backup command while the application is running:

```bash
sqlite3 "$DATABASE_PATH" ".backup '/srv/backups/baoshijie-$(date +%F).sqlite'"
tar -czf "/srv/backups/baoshijie-uploads-$(date +%F).tar.gz" -C "$UPLOAD_DIR" .
```

Test restoration regularly on a separate path before relying on a backup.

## Verification

```powershell
node --test tests/**/*.test.ts
pnpm typecheck
pnpm build
```

Browser smoke tests are under `tests/browser` and expect a running test server plus `TEST_BASE_URL`. Provider adapter and webhook tests use deterministic mocked responses and require no live keys.

## Static 3D assets

The GLB models remain deployable static assets in `public/models`:

- `/models/porsche-911-2017-gt3-rs.glb`
- `/models/porsche-911-2019-gt3-rs.glb`
