import { mkdir, readFile, rm, unlink, writeFile } from "fs/promises";
import path from "path";
import { getUploadAbsolutePathFromUrl } from "@/src/lib/uploadStorage";
import { cleanupOrphanedUploads } from "@/src/lib/uploadCleanup";

export type StagedImage = {
  url: string;
  sort_order: number;
};

type EntityKind = "product" | "seller-request";

type StagedImageFile = {
  images: StagedImage[];
  updated_at: string;
  delete_after?: string | null;
};

const REJECT_RETENTION_MS = 5 * 24 * 60 * 60 * 1000;

function stagedDir(kind: EntityKind) {
  return path.join(process.cwd(), ".staged-images", kind);
}

function stagedFile(kind: EntityKind, entityId: string) {
  return path.join(stagedDir(kind), `${entityId}.json`);
}

function normalizeImages(images: Array<string | StagedImage>): StagedImage[] {
  return images
    .map((image, index) =>
      typeof image === "string"
        ? { url: image, sort_order: index }
        : { url: image.url, sort_order: image.sort_order }
    )
    .filter((image) => typeof image.url === "string" && image.url.trim().length > 0)
    .sort((a, b) => a.sort_order - b.sort_order || a.url.localeCompare(b.url));
}

function isLocalUpload(url: string) {
  return url.startsWith("/uploads/");
}

export async function saveStagedImages(
  kind: EntityKind,
  entityId: string,
  images: Array<string | StagedImage>
) {
  const normalized = normalizeImages(images);
  const previous = await readStagedFile(kind, entityId);
  if (previous) {
    const nextSet = new Set(normalized.map((image) => image.url));
    const removedLocalUploads = previous.images.filter(
      (image) => isLocalUpload(image.url) && !nextSet.has(image.url)
    );
    if (removedLocalUploads.length > 0) {
      await deleteLocalUploads(removedLocalUploads);
    }
  }
  await mkdir(stagedDir(kind), { recursive: true });
  await writeFile(
    stagedFile(kind, entityId),
    JSON.stringify({
      images: normalized,
      updated_at: new Date().toISOString(),
      delete_after: null,
    } satisfies StagedImageFile)
  );
}

async function deleteLocalUploads(images: StagedImage[]) {
  await Promise.all(
    images.map(async (image) => {
      if (!isLocalUpload(image.url)) return;
      const absolutePath = getUploadAbsolutePathFromUrl(image.url);
      try {
        await unlink(absolutePath);
      } catch {
        // Ignore missing files or non-local URLs.
      }
    })
  );
}

async function clearExpiredStagedFile(kind: EntityKind, entityId: string, images: StagedImage[]) {
  await deleteLocalUploads(images);
  await deleteStagedImages(kind, entityId);
}

async function readStagedFile(kind: EntityKind, entityId: string): Promise<StagedImageFile | null> {
  try {
    const raw = await readFile(stagedFile(kind, entityId), "utf8");
    const parsed = JSON.parse(raw) as Partial<StagedImageFile> | null;
    const data: StagedImageFile = {
      images: normalizeImages(Array.isArray(parsed?.images) ? parsed.images : []),
      updated_at: typeof parsed?.updated_at === "string" ? parsed.updated_at : new Date(0).toISOString(),
      delete_after: typeof parsed?.delete_after === "string" ? parsed.delete_after : null,
    };

    if (data.delete_after && Date.parse(data.delete_after) <= Date.now()) {
      await clearExpiredStagedFile(kind, entityId, data.images);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function readStagedImages(kind: EntityKind, entityId: string): Promise<StagedImage[]> {
  const data = await readStagedFile(kind, entityId);
  return data?.images ?? [];
}

export async function readFirstStagedImage(kind: EntityKind, entityId: string): Promise<string | null> {
  const images = await readStagedImages(kind, entityId);
  return images[0]?.url ?? null;
}

export async function deleteStagedImages(kind: EntityKind, entityId: string) {
  try {
    await rm(stagedFile(kind, entityId), { force: true });
  } catch {
    // Ignore missing staging files.
  }
  await cleanupOrphanedUploads();
}

export async function purgeStagedImages(kind: EntityKind, entityId: string) {
  const images = await readStagedImages(kind, entityId);
  if (images.length > 0) {
    await deleteLocalUploads(images);
  }
  await deleteStagedImages(kind, entityId);
  await cleanupOrphanedUploads(true);
}

export async function scheduleStagedImageDeletion(kind: EntityKind, entityId: string) {
  const data = await readStagedFile(kind, entityId);
  if (!data) return;

  await writeFile(
    stagedFile(kind, entityId),
    JSON.stringify({
      ...data,
      delete_after: new Date(Date.now() + REJECT_RETENTION_MS).toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies StagedImageFile)
  );
}
