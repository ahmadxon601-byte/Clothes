import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy the backend SSE stream to avoid Next.js rewrite buffering issues
export async function GET(req: NextRequest) {
    const base =
        process.env.NEXT_PUBLIC_API_BASE_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        'http://127.0.0.1:3001';
    const backendUrl = `${base.replace(/\/$/, '')}/api/events`;

    try {
        const backendRes = await fetch(backendUrl, {
            signal: req.signal,
            headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
        });

        if (!backendRes.ok || !backendRes.body) {
            return new Response(null, { status: 204 });
        }

        return new Response(backendRes.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch {
        // Backend is temporarily unavailable; let EventSource retry quietly.
        return new Response(null, { status: 204 });
    }
}
