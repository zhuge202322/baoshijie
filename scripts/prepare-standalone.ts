import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next", "standalone");
if (!existsSync(standalone)) throw new Error("Standalone output is missing. Run next build first.");

const publicSource = resolve(root, "public");
if (existsSync(publicSource)) cpSync(publicSource, resolve(standalone, "public"), { recursive: true });

const staticSource = resolve(root, ".next", "static");
const staticTarget = resolve(standalone, ".next", "static");
mkdirSync(resolve(standalone, ".next"), { recursive: true });
cpSync(staticSource, staticTarget, { recursive: true });

console.log("Standalone server prepared with public and static assets.");
