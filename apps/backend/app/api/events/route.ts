import { NextRequest } from "next/server";
import { adminEvents } from "@/src/lib/events";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {}
      };
      send({ type: "connected" });
      const handler = (payload: unknown) => send(payload);
      adminEvents.on("event", handler);
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": heartbeat\n\n")); } catch { clearInterval(heartbeat); }
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
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    },
  });
}
