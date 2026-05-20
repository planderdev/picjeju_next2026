import { readFile } from "node:fs/promises";
import path from "node:path";

const assetRoot = path.resolve(process.cwd(), "public", "admin", "assets");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function isInsideAssetRoot(filePath) {
  return filePath === assetRoot || filePath.startsWith(`${assetRoot}${path.sep}`);
}

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const segments = Array.isArray(resolvedParams?.path) ? resolvedParams.path : [];
  const filePath = path.resolve(assetRoot, ...segments);

  if (!isInsideAssetRoot(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    return new Response(file, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
