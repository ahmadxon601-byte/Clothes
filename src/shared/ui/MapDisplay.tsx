'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = { lat: number; lng: number; height?: number; label?: string };

export function MapDisplay({ lat, lng, height = 150, label }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!mapRef.current) {
            const map = L.map(containerRef.current, {
                center: [lat, lng],
                zoom: 15,
                zoomControl: true,
                scrollWheelZoom: true,
                dragging: true,
                doubleClickZoom: true,
                attributionControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);

            const marker = L.marker([lat, lng]).addTo(map);
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

        const timer = window.setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, 0);

        return () => {
            window.clearTimeout(timer);
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
