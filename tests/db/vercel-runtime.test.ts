import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

test("Vercel uses its writable temporary directory for the default SQLite database", () => {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const clientUrl = pathToFileURL(resolve(projectRoot, "lib/db/client.ts")).href;
  const workspace = mkdtempSync(join(tmpdir(), "baoshijie-vercel-"));
  const applicationDirectory = join(workspace, "app");
  const temporaryDirectory = join(workspace, "tmp");
  mkdirSync(applicationDirectory);
  mkdirSync(temporaryDirectory);

  try {
    execFileSync(
      process.execPath,
      ["--input-type=module", "-e", `const { getDatabase } = await import(${JSON.stringify(clientUrl)}); getDatabase();`],
      {
        cwd: applicationDirectory,
        env: {
          ...process.env,
          DATABASE_PATH: "",
          TEMP: temporaryDirectory,
          TMP: temporaryDirectory,
          TMPDIR: temporaryDirectory,
          VERCEL: "1"
        },
        stdio: "pipe"
      }
    );

    assert.equal(existsSync(join(temporaryDirectory, "baoshijie.sqlite")), true);
    assert.equal(existsSync(join(applicationDirectory, "storage", "baoshijie.sqlite")), false);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
