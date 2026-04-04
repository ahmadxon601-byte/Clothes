import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = ["http://127.0.0.1:3010", "http://localhost:3010"];
const API_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};
const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

function getAllowedOrigins() {
  const candidates = [
    process.env.URL?.trim(),
    process.env.TELEGRAM_WEBAPP_URL?.trim(),
    ...DEFAULT_ALLOWED_ORIGINS,
  ].filter(Boolean) as string[];

  return new Set(candidates);
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  if (request.method === "OPTIONS") {
    const headers = new Headers(API_CORS_HEADERS);
    if (origin && allowedOrigins.has(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Vary", "Origin");
    }
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => headers.set(key, value));
    return new NextResponse(null, { status: 200, headers });
  }

  const response = NextResponse.next();
  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  Object.entries(API_CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
