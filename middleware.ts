import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
  }

  const response = NextResponse.next();
  Object.entries(CORS_HEADERS).forEach(([key, value]) =>
    response.headers.set(key, value)
  );
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
