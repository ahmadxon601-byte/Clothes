'use client';

import { useEffect, useRef } from 'react';
import type L from 'leaflet';

type Props = { lat: number; lng: number; height?: number; label?: string };

export function MapDisplay({ lat, lng, height = 150, label }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        let disposed = false;
        let timer = 0;

        void import('leaflet').then((leafletModule) => {
            if (disposed || !containerRef.current) return;

            const Leaflet = leafletModule.default;

            delete (Leaflet.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            if (!mapRef.current) {
                const map = Leaflet.map(containerRef.current, {
                    center: [lat, lng],
                    zoom: 15,
                    zoomControl: true,
                    scrollWheelZoom: true,
                    dragging: true,
                    doubleClickZoom: true,
                    attributionControl: true,
                });

                Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                }).addTo(map);

                const marker = Leaflet.marker([lat, lng]).addTo(map);
                if (label) marker.bindPopup(label);

                mapRef.current = map;
                markerRef.current = marker;
            } else {
                mapRef.current.setView([lat, lng], mapRef.current.getZoom(), { animate: false });
                markerRef.current?.setLatLng([lat, lng]);
                if (label && markerRef.current) {
                    markerRef.current.bindPopup(label);
                }
            }

            timer = window.setTimeout(() => {
                mapRef.current?.invalidateSize();
            }, 0);
        }).catch(() => {
            // Keep the fallback container visible if Leaflet fails to load.
        });

        return () => {
            window.clearTimeout(timer);
            disposed = true;
        };
    }, [lat, lng, label]);

    useEffect(() => {
        return () => {
            markerRef.current?.remove();
            markerRef.current = null;
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    return (
        <div
            style={{ height, width: '100%', isolation: 'isolate', position: 'relative', zIndex: 0 }}
            className="overflow-hidden bg-[#f3f4f6] dark:bg-[#1a1a1a]"
        >
            <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}
