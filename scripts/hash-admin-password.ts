import { createPasswordHash } from "../lib/auth/session.ts";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-admin-password.ts "your password"');
  process.exit(1);
}
console.log(createPasswordHash(password));
