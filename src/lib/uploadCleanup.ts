import { readdir, readFile, stat, unlink } from "fs/promises";
import path from "path";
import { query } from "@/src/lib/db";
import { getUploadsDir } from "@/src/lib/uploadStorage";

declare global {
  // eslint-disable-next-line no-var
  var _uploadCleanupStartedAt: number | undefined;
  // eslint-disable-next-line no-var
  var _uploadCleanupRunning: Promise<void> | undefined;
}

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
const ORPHAN_MIN_AGE_MS = 60 * 60 * 1000;

function isLocalUpload(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("/uploads/");
}

async function listStagedReferences(rootDir: string) {
  const urls = new Set<string>();
  try {
    const kinds = await readdir(rootDir, { withFileTypes: true });
    for (const kind of kinds) {
      if (!kind.isDirectory()) continue;
      const kindDir = path.join(rootDir, kind.name);
      const files = await readdir(kindDir, { withFileTypes: true });
      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".json")) continue;
        try {
          const raw = await readFile(path.join(kindDir, file.name), "utf8");
          const parsed = JSON.parse(raw) as { images?: Array<{ url?: unknown }> } | null;
          for (const image of parsed?.images ?? []) {
            if (isLocalUpload(image?.url)) {
              urls.add(image.url);
            }
          }
        } catch {
          // Ignore malformed staging files.
        }
      }
    }
  } catch {
    // Ignore missing staged-images dir.
  }
  return urls;
}

async function collectReferencedUploads() {
  const referenced = new Set<string>();

  const registerRows = async (sql: string) => {
    try {
      const result = await query(sql);
      for (const row of result.rows) {
        if (isLocalUpload(row.url)) {
          referenced.add(row.url);
        }
      }
    } catch {
      // Ignore missing optional tables/columns and keep cleanup best-effort.
    }
  };

  await registerRows(`
    SELECT url FROM product_images WHERE url LIKE '/uploads/%'
    UNION
    SELECT image_url AS url FROM stores WHERE image_url LIKE '/uploads/%'
    UNION
    SELECT image_url AS url FROM seller_requests WHERE image_url LIKE '/uploads/%'
    UNION
    SELECT image_url AS url FROM banners WHERE image_url LIKE '/uploads/%'
  `);

  await registerRows(`
    SELECT jsonb_array_elements(pending_update_payload->'images')->>'url' AS url
    FROM products
    WHERE pending_update_payload IS NOT NULL
      AND jsonb_typeof(pending_update_payload->'images') = 'array'
  `);

  const staged = await listStagedReferences(path.join(process.cwd(), ".staged-images"));
  for (const url of staged) {
    referenced.add(url);
  }

  return referenced;
}

async function cleanupOrphanedUploadsInternal() {
  const referenced = await collectReferencedUploads();
  const uploadDir = getUploadsDir();
  const files = await readdir(uploadDir, { withFileTypes: true }).catch(() => []);
  const now = Date.now();

  await Promise.all(
    files.map(async (file) => {
      if (!file.isFile()) return;
      const publicUrl = `/uploads/${file.name}`;
      if (referenced.has(publicUrl)) return;

      const absolutePath = path.join(uploadDir, file.name);
      try {
        const info = await stat(absolutePath);
        if (now - info.mtimeMs < ORPHAN_MIN_AGE_MS) return;
        await unlink(absolutePath);
      } catch {
        // Ignore missing files or transient FS issues.
      }
    })
  );
}

export async function cleanupOrphanedUploads(force = false) {
  const now = Date.now();
  if (!force && globalThis._uploadCleanupRunning) {
    return globalThis._uploadCleanupRunning;
  }
  if (
    !force &&
    globalThis._uploadCleanupStartedAt &&
    now - globalThis._uploadCleanupStartedAt < CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  globalThis._uploadCleanupStartedAt = now;
  globalThis._uploadCleanupRunning = cleanupOrphanedUploadsInternal()
    .catch((error) => {
      console.error("[upload cleanup]", error);
    })
    .finally(() => {
      globalThis._uploadCleanupRunning = undefined;
    });

  return globalThis._uploadCleanupRunning;
}
