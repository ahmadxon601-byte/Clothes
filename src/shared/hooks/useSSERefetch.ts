'use client';
import { useEffect, useRef } from 'react';

type Subscriber = {
  watchTypesRef: { current: string[] };
  refetchRef: { current: () => void };
};

let sharedEventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let subscribers = new Set<Subscriber>();

function cleanupSharedEventSource() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    sharedEventSource?.close();
  } catch {}
  sharedEventSource = null;
}

function scheduleReconnect() {
  if (reconnectTimer || subscribers.size === 0) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ensureSharedConnection();
  }, 3000);
}

function notifySubscribers(type: string) {
  subscribers.forEach((subscriber) => {
    if (subscriber.watchTypesRef.current.includes(type)) {
      subscriber.refetchRef.current();
    }
  });
}

function ensureSharedConnection() {
  if (typeof window === 'undefined' || sharedEventSource || subscribers.size === 0) return;

  const eventSource = new EventSource('/api/events');
  sharedEventSource = eventSource;

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { type?: string };
      if (!payload.type || payload.type === 'connected') return;
      notifySubscribers(payload.type);
    } catch {}
  };

  eventSource.onerror = () => {
    cleanupSharedEventSource();
    scheduleReconnect();
  };
}

export function useSSERefetch(watchTypes: string[], refetch: () => void) {
  const refetchRef = useRef(refetch);
  const watchTypesRef = useRef(watchTypes);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  refetchRef.current = refetch;
  watchTypesRef.current = watchTypes;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const subscriber: Subscriber = {
      watchTypesRef,
      refetchRef: {
        current: () => {
          if (pendingRef.current) return;
          pendingRef.current = setTimeout(() => {
            pendingRef.current = null;
            refetchRef.current();
          }, 200);
        },
      },
    };

    subscribers.add(subscriber);
    ensureSharedConnection();

    return () => {
      subscribers.delete(subscriber);
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
      if (subscribers.size === 0) {
        cleanupSharedEventSource();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
