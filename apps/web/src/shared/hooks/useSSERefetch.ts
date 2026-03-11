'use client';
import { useEffect, useRef } from 'react';

export function useSSERefetch(watchTypes: string[], refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (es) { try { es.close(); } catch {} }
      es = new EventSource('/api/events');

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as { type?: string };
          if (!payload.type || payload.type === 'connected') return;
          if (watchTypes.includes(payload.type)) refetchRef.current();
        } catch {}
      };

      es.onerror = () => {
        try { es?.close(); } catch {}
        es = null;
        // Reconnect after 3s
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { es?.close(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
