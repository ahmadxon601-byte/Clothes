'use client';
import { useEffect, useRef } from 'react';

export function useSSERefetch(watchTypes: string[], refetch: () => void) {
  const refetchRef = useRef(refetch);
  const watchTypesRef = useRef(watchTypes);
  refetchRef.current = refetch;
  watchTypesRef.current = watchTypes;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const sseUrl = '/api/events';

    const connect = () => {
      if (disposed) return;
      if (es) { try { es.close(); } catch {} }
      es = new EventSource(sseUrl);

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as { type?: string };
          if (!payload.type || payload.type === 'connected') return;
          if (watchTypesRef.current.includes(payload.type)) refetchRef.current();
        } catch {}
      };

      es.onerror = () => {
        if (disposed) return;
        try { es?.close(); } catch {}
        es = null;
        // Reconnect after 3s
        reconnectTimer = setTimeout(() => {
          if (!disposed) connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { es?.close(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
