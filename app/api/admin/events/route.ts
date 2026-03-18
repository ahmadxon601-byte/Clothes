import { NextRequest } from "next/server";
import { requireRole, fail, AuthError } from "@/src/lib/auth";
import { verifyToken } from "@/src/lib/jwt";
import { adminEvents } from "@/src/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // EventSource cannot set custom headers, so also accept ?token= query param
    const qToken = req.nextUrl.searchParams.get("token");
    if (qToken && !req.headers.get("authorization")) {
      const payload = verifyToken(qToken);
      if (payload.role !== "admin") throw new AuthError("Forbidden", 403);
    } else {
      requireRole(req, "admin");
    }
  } catch (e) {
    if (e instanceof AuthError) return fail(e.message, e.status);
    return fail("Unauthorized", 401);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Initial connection event
      send({ type: "connected" });

      const handler = (payload: unknown) => send(payload);
      adminEvents.on("event", handler);

      // Heartbeat every 25 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      req.signal.addEventListener("abort", () => {
        adminEvents.off("event", handler);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
