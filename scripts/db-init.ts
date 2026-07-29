import { getDatabase } from "../lib/db/client.ts";
import { seedDatabase } from "../lib/db/seed.ts";

const database = getDatabase();
seedDatabase(database);

const productCount = database.prepare("SELECT COUNT(*) count FROM products").get()?.count;
console.log(`Commerce database ready with ${String(productCount)} products.`);
