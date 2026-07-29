import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getUploadDirectory, resolveMediaPath } from "@/lib/media/storage";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif"
};

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const filename = path[0] || "";
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const file = await readFile(resolveMediaPath(getUploadDirectory(), path));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return new NextResponse("Media not found", { status: 404 });
  }
}
