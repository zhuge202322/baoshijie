import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { resolveMediaPath, saveImageUpload } from "../../lib/media/storage.ts";

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

test("image uploads use generated names and persist validated bytes", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "baoshijie-upload-"));
  try {
    const file = new File([jpegBytes], "../../customer-photo.jpg", { type: "image/jpeg" });
    const saved = await saveImageUpload(file, { uploadDir, randomId: () => "asset-id" });

    assert.equal(saved.filename, "asset-id.jpg");
    assert.equal(saved.publicUrl, "/media/asset-id.jpg");
    assert.equal(saved.originalName, "customer-photo.jpg");
    assert.equal(existsSync(join(uploadDir, saved.filename)), true);
    assert.deepEqual(readFileSync(join(uploadDir, saved.filename)), Buffer.from(jpegBytes));
  } finally {
    rmSync(resolve(uploadDir), { recursive: true, force: true });
  }
});

test("image uploads reject unsupported, spoofed, and oversized files", async () => {
  const uploadDir = mkdtempSync(join(tmpdir(), "baoshijie-upload-"));
  try {
    await assert.rejects(
      saveImageUpload(new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" }), { uploadDir }),
      /JPEG, PNG, WebP, or AVIF/
    );
    await assert.rejects(
      saveImageUpload(new File(["not an image"], "fake.jpg", { type: "image/jpeg" }), { uploadDir }),
      /file signature/
    );
    await assert.rejects(
      saveImageUpload(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "huge.jpg", { type: "image/jpeg" }), { uploadDir }),
      /10 MB/
    );
  } finally {
    rmSync(resolve(uploadDir), { recursive: true, force: true });
  }
});

test("media paths accept generated filenames and reject traversal", () => {
  const root = resolve(tmpdir(), "baoshijie-media-root");
  assert.equal(resolveMediaPath(root, ["08dc8c31-acde-4cd4-bbe1-acde4455fdda.webp"]), resolve(root, "08dc8c31-acde-4cd4-bbe1-acde4455fdda.webp"));
  assert.throws(() => resolveMediaPath(root, ["..", "secret.jpg"]), /Invalid media path/);
  assert.throws(() => resolveMediaPath(root, ["not safe.jpg"]), /Invalid media path/);
});
