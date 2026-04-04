import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";

// ── Response helpers ─────────────────────────────────────────────────────────

export const ok = (data: unknown, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

export const failWithHeaders = (
  error: string,
  status = 400,
  headers?: HeadersInit
) => NextResponse.json({ success: false, error }, { status, headers });

// ── Auth helpers ─────────────────────────────────────────────────────────────

export function getUser(req: NextRequest): JwtPayload | null {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): JwtPayload {
  const user = getUser(req);
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export function requireRole(
  req: NextRequest,
  ...roles: string[]
): JwtPayload {
  const user = requireAuth(req);
  if (!roles.includes(user.role)) throw new AuthError("Forbidden", 403);
  return user;
}

// ── Pagination helper ─────────────────────────────────────────────────────────

export function paginate(
  page: string | null,
  limit: string | null
): { page: number; limit: number; offset: number } {
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const parsedLimit = Number.parseInt(limit ?? "20", 10);
  const p = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const l = Number.isFinite(parsedLimit)
    ? Math.min(100, Math.max(1, parsedLimit))
    : 20;
  return { page: p, limit: l, offset: (p - 1) * l };
}

// ── Custom error ──────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
