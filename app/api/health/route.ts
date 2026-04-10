import { NextResponse } from "next/server";
import { query } from "@/src/lib/db";
import { ensureUploadsDirWritable, isUploadStorageError } from "@/src/lib/uploadStorage";

const REQUIRED_ENV_KEYS = [
  "JWT_SECRET",
  "URL",
  "TELEGRAM_WEBAPP_URL",
  "TELEGRAM_BOT_TOKEN",
  "ADMIN_TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "ADMIN_TELEGRAM_WEBHOOK_SECRET",
];

export async function GET() {
  const missingEnv = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  let uploads = "ok";
  let uploadError: string | null = null;

  try {
    await ensureUploadsDirWritable();
  } catch (error) {
    uploads = "error";
    uploadError =
      isUploadStorageError(error)
        ? "Upload storage is not writable. Mount a persistent writable volume at public/uploads."
        : error instanceof Error
          ? error.message
          : "Upload storage check failed";
  }

  try {
    await query("SELECT 1");

    return NextResponse.json({
      status: missingEnv.length === 0 && uploads === "ok" ? "ok" : "degraded",
      time: new Date().toISOString(),
      env: process.env.NODE_ENV,
      database: "ok",
      uploads,
      ...(uploadError ? { uploadError } : {}),
      missingEnv,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        database: "error",
        uploads,
        ...(uploadError ? { uploadError } : {}),
        missingEnv,
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 }
    );
  }
}
