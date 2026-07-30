import type { CommerceDatabase } from "./client.ts";
import { products } from "../../data/products.ts";

const categories = [
  ["category-exterior-aero", "Exterior Aero", "exterior-aero", "Exterior aero components", 10],
  ["category-interior-components", "Interior Components", "interior-components", "Interior components", 20],
  ["category-performance-parts", "Performance parts", "performance-parts", "Performance parts", 30],
  ["category-oe-aftermarket", "OE aftermarket parts", "oe-aftermarket-parts", "OE aftermarket parts", 40]
] as const;

const categoryIds = new Map(categories.map(([id, name]) => [name, id]));
const defaultSupportEmail = "info@bespoke-elemental.com";

const mediaSlots = [
  ["home.hero.1", "home", "Hero slide 1", "/images/bespoke-elemental/hero-01.png", "Classic Porsche 911 in a dark studio with its body panels open", 10],
  ["home.hero.2", "home", "Hero slide 2", "/images/bespoke-elemental/hero-02.png", "Orange classic Porsche 911 Carrera in profile", 20],
  ["home.hero.3", "home", "Hero slide 3", "/images/bespoke-elemental/hero-03.png", "Orange classic Porsche 911 Carrera viewed from the rear", 30],
  ["home.heritage", "home", "Heritage Engineering", "/images/bespoke-elemental/heritage-hero-hd.webp", "Carbon fiber bodywork with white and red accents", 40],
  ["about.hero", "about", "About hero", "/images/bespoke-elemental/about-01.png", "Carbon fiber components in the Bespoke Elemental workshop", 10],
  ["about.gallery.1", "about", "Gallery image 1", "/images/bespoke-elemental/about-01.png", "Carbon fiber components and composite materials in the workshop", 20],
  ["about.gallery.2", "about", "Gallery image 2", "/images/bespoke-elemental/about-02.png", "Carbon fiber process excellence in an autoclave workshop", 30],
  ["about.gallery.3", "about", "Gallery image 3", "/images/bespoke-elemental/about-03.png", "Carbon fiber component designed in precision CAD software", 40],
  ["about.gallery.4", "about", "Gallery image 4", "/images/bespoke-elemental/about-04.png", "Composite production tools, molds, and racing parts", 50],
  ["about.gallery.5", "about", "Gallery image 5", "/images/bespoke-elemental/about-05.png", "Carbon fiber interior components and workshop materials", 60],
  ["about.gallery.6", "about", "Gallery image 6", "/images/bespoke-elemental/about-06.png", "Advanced carbon fiber production equipment and raw material", 70],
  ["heritage.hero", "heritage", "Heritage hero", "/images/bespoke-elemental/heritage-hero-hd.webp", "Heritage Porsche engineering in carbon fiber", 10],
  ["shipping.hero", "shipping", "Shipping hero", "/images/bespoke-elemental/about-06.png", "Bespoke Elemental workshop logistics", 10],
  ["site.fallback-hero", "site", "Fallback hero", "/images/carbonforge-hero.jpg", "Classic Porsche component craftsmanship", 10]
] as const;

export function seedDatabase(database: CommerceDatabase) {
  const now = Date.now();
  database.exec("BEGIN IMMEDIATE");

  try {
    const insertCategory = database.prepare(`
      INSERT INTO categories (id, name, slug, description, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);
    for (const [id, name, slug, description, sortOrder] of categories) {
      insertCategory.run(id, name, slug, description, sortOrder, now, now);
    }

    const insertProduct = database.prepare(`
      INSERT INTO products (
        id, category_id, slug, name, part_no, product_type, material, price_cents,
        image_url, short_description, description, compatibility_json, specs_json,
        badge, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);
    for (const product of products) {
      const categoryId = categoryIds.get(product.category);
      if (!categoryId) {
        throw new Error(`Missing seeded category for ${product.category}`);
      }
      insertProduct.run(
        `product-${product.slug}`,
        categoryId,
        product.slug,
        product.name,
        product.partNo,
        product.productType,
        product.material,
        Math.round(product.price * 100),
        product.image,
        product.short,
        product.description,
        JSON.stringify(product.compatibility),
        JSON.stringify(product.specs),
        product.badge || null,
        now,
        now
      );
    }

    database
      .prepare(`
        INSERT INTO site_settings (
          id, website_name, logo_url, support_email, support_phone,
          support_whatsapp, company_address, updated_at
        ) VALUES (1, ?, ?, ?, '', '', '', ?)
        ON CONFLICT(id) DO NOTHING
      `)
      .run("Bespoke Elemental", "/brand/flame-logo.png", defaultSupportEmail, now);

    const insertSocial = database.prepare(`
      INSERT INTO social_links (id, platform, label, url, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);
    insertSocial.run("social-instagram", "instagram", "Instagram", "https://www.instagram.com/", 10, now, now);
    insertSocial.run("social-facebook", "facebook", "Facebook", "https://www.facebook.com/", 20, now, now);

    const insertMedia = database.prepare(`
      INSERT INTO media_slots (
        slot_key, page, section_label, image_url, default_image_url, alt_text, sort_order, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slot_key) DO NOTHING
    `);
    for (const [slotKey, page, sectionLabel, imageUrl, altText, sortOrder] of mediaSlots) {
      insertMedia.run(slotKey, page, sectionLabel, imageUrl, imageUrl, altText, sortOrder, now);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
