import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type ImageDefinition = {
  extension: "jpg" | "png" | "webp" | "avif";
  matches: (bytes: Uint8Array) => boolean;
};

const definitions: Record<string, ImageDefinition> = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  },
  "image/png": {
    extension: "png",
    matches: (bytes) => bytes.length >= 8 && Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) => bytes.length >= 12 && Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  },
  "image/avif": {
    extension: "avif",
    matches: (bytes) => bytes.length >= 12 && Buffer.from(bytes.subarray(4, 8)).toString("ascii") === "ftyp" && ["avif", "avis"].includes(Buffer.from(bytes.subarray(8, 12)).toString("ascii"))
  }
};

export type SavedImage = {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
};

export function getUploadDirectory() {
  return resolve(process.env.UPLOAD_DIR || resolve(process.cwd(), "storage", "uploads"));
}

export async function saveImageUpload(
  file: File,
  options: { uploadDir?: string; randomId?: () => string } = {}
): Promise<SavedImage> {
  const definition = definitions[file.type];
  if (!definition) throw new Error("Images must be JPEG, PNG, WebP, or AVIF files");
  if (file.size === 0) throw new Error("Image file is empty");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image files cannot exceed 10 MB");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!definition.matches(bytes)) throw new Error("Image file signature does not match its declared type");

  const uploadDir = resolve(options.uploadDir || getUploadDirectory());
  const filename = `${(options.randomId || randomUUID)()}.${definition.extension}`;
  const target = resolveMediaPath(uploadDir, [filename]);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });

  return {
    filename,
    originalName: basename(file.name.replaceAll("\\", "/")),
    mimeType: file.type,
    sizeBytes: file.size,
    publicUrl: `/media/${filename}`
  };
}

export function resolveMediaPath(uploadDir: string, pathParts: string[]) {
  if (pathParts.length !== 1 || !/^[a-zA-Z0-9_-]{8,80}\.(?:jpg|png|webp|avif)$/.test(pathParts[0] || "")) {
    throw new Error("Invalid media path");
  }
  const root = resolve(uploadDir);
  const target = resolve(root, pathParts[0]);
  if (!target.startsWith(`${root}\\`) && !target.startsWith(`${root}/`)) throw new Error("Invalid media path");
  return target;
}
