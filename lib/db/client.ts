import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedDatabase } from "./seed.ts";

const schema = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  part_no TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL CHECK (product_type IN ('Bespoke', 'OE aftermarket')),
  material TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  compatibility_json TEXT NOT NULL DEFAULT '[]',
  specs_json TEXT NOT NULL DEFAULT '{}',
  badge TEXT,
  inventory_status TEXT NOT NULL DEFAULT 'made_to_order' CHECK (inventory_status IN ('in_stock', 'made_to_order', 'unavailable')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id, is_active, name);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  website_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  support_email TEXT NOT NULL DEFAULT '',
  support_phone TEXT NOT NULL DEFAULT '',
  support_whatsapp TEXT NOT NULL DEFAULT '',
  company_address TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  public_url TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media_slots (
  slot_key TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  section_label TEXT NOT NULL,
  image_url TEXT NOT NULL,
  default_image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS media_slots_page_idx ON media_slots(page, sort_order);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  lookup_token_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAID', 'PAYMENT_FAILED',
    'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED', 'REFUNDED'
  )),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('airwallex', 'paypal')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents INTEGER NOT NULL CHECK (shipping_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0 AND total_cents = subtotal_cents + shipping_cents),
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('standard', 'expedited')),
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT NOT NULL DEFAULT '',
  customer_note TEXT NOT NULL DEFAULT '',
  internal_note TEXT NOT NULL DEFAULT '',
  provider_reference TEXT,
  paid_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(email, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_slug TEXT NOT NULL,
  part_no TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 9),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents = unit_price_cents * quantity),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('airwallex', 'paypal')),
  provider_payment_id TEXT,
  status TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS payments_order_idx ON payments(order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_id_idx ON payments(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('airwallex', 'paypal')),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  error_message TEXT NOT NULL DEFAULT '',
  received_at INTEGER NOT NULL,
  processed_at INTEGER,
  UNIQUE(provider, provider_event_id)
);

PRAGMA user_version = 1;
`;

export type CommerceDatabase = DatabaseSync;

export function createDatabase(filename: string) {
  if (filename !== ":memory:") {
    mkdirSync(dirname(resolve(filename)), { recursive: true });
  }

  const database = new DatabaseSync(filename);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  if (filename !== ":memory:") {
    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA synchronous = NORMAL");
  }
  return database;
}

export function migrateDatabase(database: CommerceDatabase) {
  database.exec(schema);
}

const globalDatabase = globalThis as typeof globalThis & {
  __commerceDatabase?: CommerceDatabase;
};

export function getDatabase() {
  if (!globalDatabase.__commerceDatabase) {
    const defaultDirectory = process.env.VERCEL ? tmpdir() : resolve(process.cwd(), "storage");
    const filename = process.env.DATABASE_PATH || resolve(defaultDirectory, "baoshijie.sqlite");
    const database = createDatabase(filename);
    migrateDatabase(database);
    seedDatabase(database);
    globalDatabase.__commerceDatabase = database;
  }
  return globalDatabase.__commerceDatabase;
}
