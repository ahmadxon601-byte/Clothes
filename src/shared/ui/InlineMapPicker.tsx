'use client';

import { useEffect, useRef } from 'react';

interface Props {
    onPick: (lat: number, lng: number) => void;
    height?: number;
}

/**
 * Inline Leaflet map using raw L.map() — avoids react-leaflet MapContainer reuse errors.
 */
export function InlineMapPicker({ onPick, height = 260 }: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!divRef.current || typeof window === 'undefined') return;
        let cancelled = false;

        import('leaflet').then((L) => {
            if (cancelled || !divRef.current || mapRef.current) return;

            // Fix default icon paths
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const map = L.map(divRef.current!, { center: [41.0011, 71.6681], zoom: 13, zoomControl: true, attributionControl: false });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                if (markerRef.current) markerRef.current.remove();
                markerRef.current = L.marker([lat, lng]).addTo(map);
                onPick(lat, lng);
            });

            mapRef.current = map;
        });

        return () => {
            cancelled = true;
            if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={divRef}
            style={{ height, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}
        />
    );
}
