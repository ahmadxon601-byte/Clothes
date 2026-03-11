import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy the backend SSE stream to avoid Next.js rewrite buffering issues
export async function GET(req: NextRequest) {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/events`;

    const backendRes = await fetch(backendUrl, {
        signal: req.signal,
        headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
    });

    return new Response(backendRes.body, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
