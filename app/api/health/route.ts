import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}
