# Commerce Admin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hard-coded storefront content with a SQLite-backed catalog/CMS and provide a secure single-administrator back office.

**Architecture:** Node's built-in SQLite API owns a WAL-enabled database on persistent disk. Server repositories expose catalog, settings, media, and order data; protected server actions power the admin pages, while public server components consume the same repositories.

**Tech Stack:** Next.js App Router, TypeScript, Node 24 `node:sqlite`, scrypt/HMAC from `node:crypto`, Node's native test runner, Playwright, and local persistent uploads.

---

### Task 1: Test and create the database schema

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/client.ts`
- Create: `lib/db/migrate.ts`
- Create: `drizzle.config.ts`
- Create: `tests/db/schema.test.ts`
- Modify: `package.json`

- [x] Add native database/test scripts without third-party database dependencies.
- [ ] Write a failing test that creates a temporary database and expects all catalog, content, order, payment, and webhook tables to exist with foreign keys enabled.
- [ ] Run `pnpm test tests/db/schema.test.ts` and confirm the missing schema failure.
- [ ] Implement the schema in integer cents, create the client with `journal_mode = WAL` and `foreign_keys = ON`, and generate/apply migrations.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Seed existing storefront content

**Files:**
- Create: `lib/db/seed.ts`
- Create: `scripts/db-init.ts`
- Create: `tests/db/seed.test.ts`
- Modify: `package.json`
- Read: `data/products.ts`

- [ ] Write a failing test that initializes an empty temporary database and expects eight current products, default categories, site settings, social links, and every existing page image slot.
- [ ] Run the test and confirm the seed module is missing.
- [ ] Implement idempotent seeding from the current product and image data and add `db:init`/`db:seed` scripts.
- [ ] Run the seed twice in the test and verify no duplicate rows.

### Task 3: Add typed repositories and validation

**Files:**
- Create: `lib/catalog/repository.ts`
- Create: `lib/content/repository.ts`
- Create: `lib/orders/repository.ts`
- Create: `lib/validation/catalog.ts`
- Create: `lib/validation/content.ts`
- Create: `tests/repositories/catalog.test.ts`

- [ ] Write failing tests for category deletion guards, product archive semantics, cents-only prices, site setting updates, social ordering, and media-slot updates.
- [ ] Run the tests and confirm repository functions are absent.
- [x] Implement repository functions with transactions and typed validation at mutation boundaries.
- [ ] Run focused repository tests and confirm they pass.

### Task 4: Add single-admin authentication

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/auth/require-admin.ts`
- Create: `lib/auth/rate-limit.ts`
- Create: `app/admin/login/page.tsx`
- Create: `app/api/admin/session/route.ts`
- Create: `tests/auth/session.test.ts`

- [ ] Write failing tests for password-hash verification, signed session expiry, tampered cookies, and login throttling.
- [ ] Run the tests and verify the expected failures.
- [x] Implement scrypt password verification, HMAC-signed HttpOnly cookies, timing-safe username comparison, and per-IP login throttling.
- [ ] Add login/logout UI and verify tests pass.

### Task 5: Build the protected admin shell

**Files:**
- Create: `app/admin/(protected)/layout.tsx`
- Create: `app/admin/(protected)/page.tsx`
- Create: `components/admin/AdminNav.tsx`
- Create: `app/admin/admin.css`
- Modify: `app/globals.css`

- [ ] Add a browser test that unauthenticated `/admin` redirects to `/admin/login` and an authenticated request renders the dashboard.
- [ ] Confirm the test fails before the protected layout exists.
- [ ] Implement the restrained operational dashboard with navigation, responsive tables, empty/loading/error states, and logout.
- [ ] Re-run the browser test at desktop and 375 px widths.

### Task 6: Build category and product CRUD

**Files:**
- Create: `app/admin/(protected)/categories/page.tsx`
- Create: `app/admin/(protected)/products/page.tsx`
- Create: `app/admin/(protected)/products/new/page.tsx`
- Create: `app/admin/(protected)/products/[id]/page.tsx`
- Create: `app/admin/actions/catalog.ts`
- Create: `components/admin/ProductForm.tsx`
- Create: `tests/admin/catalog-actions.test.ts`

- [ ] Write failing action tests for create/edit/archive/restore product, price updates, category create/edit/order/delete, invalid slugs, and protected access.
- [ ] Confirm failures, then implement server actions with revalidation and structured form errors.
- [ ] Verify product deletion archives ordered products and physically deletes never-ordered products.
- [ ] Run action tests and exercise the complete CRUD flow in the browser.

### Task 7: Build settings, social, and media management

**Files:**
- Create: `app/admin/(protected)/settings/page.tsx`
- Create: `app/admin/(protected)/social/page.tsx`
- Create: `app/admin/(protected)/media/page.tsx`
- Create: `app/admin/actions/content.ts`
- Create: `lib/media/storage.ts`
- Create: `app/media/[...path]/route.ts`
- Create: `tests/media/storage.test.ts`

- [ ] Write failing tests for allowed image types, 10 MB limit, generated filenames, traversal rejection, setting edits, social CRUD, and media-slot replacement.
- [ ] Confirm failures and implement local persistent media storage plus protected actions.
- [ ] Group media slots by page and show current previews, upload replacement, alt text, and seeded restore controls.
- [ ] Run unit/action tests and browser-check all admin content screens.

### Task 8: Migrate the public storefront to repositories

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/catalog/page.tsx`
- Modify: `app/product/[slug]/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/heritage/page.tsx`
- Modify: `app/shipping/page.tsx`
- Modify: `components/Providers.tsx`
- Modify: `components/CartProvider.tsx`
- Modify: `components/SiteNav.tsx`
- Modify: `components/Footer.tsx`

- [ ] Write failing tests that edited product price, site name/logo/contact/social values, and media slots appear in public repository projections.
- [ ] Convert public pages to runtime server data, pass catalog data into the cart provider, and preserve current seeded rendering.
- [ ] Remove all storefront tax labels/calculations and keep USD display.
- [ ] Run tests, typecheck, production build, and visual regression checks across public pages.

### Task 9: Document single-server operations

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `next.config.mjs`

- [ ] Document `DATABASE_PATH`, `UPLOAD_DIR`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET`.
- [ ] Ignore runtime database/uploads, enable standalone output, and document persistent mounts, backup, migration, seed, build, and start commands.
- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and a fresh temporary `db:init` smoke test.
