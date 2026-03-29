'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const NAMANGAN: [number, number] = [41.0011, 71.6681];

export interface LatLng {
    lat: number;
    lng: number;
}

interface MapPickerProps {
    value?: LatLng;
    onChange: (coords: LatLng) => void;
    height?: string;
}

export function MapPicker({ value, onChange, height = '220px' }: MapPickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const latestReverseRef = useRef(0);
    const [mounted, setMounted] = useState(false);
    const [address, setAddress] = useState('');

    const initial: [number, number] = value ? [value.lat, value.lng] : NAMANGAN;

    const reverseGeocode = async (lat: number, lng: number) => {
        const requestId = latestReverseRef.current + 1;
        latestReverseRef.current = requestId;

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`,
                { headers: { 'User-Agent': 'QulaymarketUz/1.0' } }
            );
            const data = await res.json();
            const parts = [
                data.address?.road || data.address?.pedestrian || data.address?.suburb,
                data.address?.city || data.address?.town || data.address?.county,
            ].filter(Boolean);
            if (latestReverseRef.current !== requestId) return;
            setAddress(parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || '');
        } catch {
            if (latestReverseRef.current !== requestId) return;
            setAddress('');
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !containerRef.current) return;
        if (mapRef.current) return;

        let disposed = false;

        const init = async () => {
            const L = (await import('leaflet')).default;
            if (disposed || !containerRef.current || mapRef.current) return;

            const pickerIcon = L.divIcon({
                className: 'map-picker-marker',
                html: `
                    <div style="
                        width:18px;
                        height:18px;
                        border-radius:9999px;
                        background:#13ec37;
                        border:3px solid #ffffff;
                        box-shadow:0 10px 24px rgba(0,0,0,0.28);
                    "></div>
                `,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
            });

            const map = L.map(containerRef.current, {
                center: initial,
                zoom: 13,
                zoomControl: true,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            const marker = L.marker(initial, { draggable: true, icon: pickerIcon }).addTo(map);

            const syncSize = () => map.invalidateSize();
            syncSize();
            const frame = window.requestAnimationFrame(syncSize);
            window.addEventListener('resize', syncSize);

            const commitPoint = (lat: number, lng: number, recenter = false) => {
                marker.setLatLng([lat, lng]);
                if (recenter) {
                    map.setView([lat, lng], map.getZoom(), { animate: false });
                    map.invalidateSize();
                }
                onChange({ lat, lng });
                void reverseGeocode(lat, lng);
            };

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                commitPoint(pos.lat, pos.lng);
            });

            map.on('click', (e: any) => {
                commitPoint(e.latlng.lat, e.latlng.lng);
            });

            mapRef.current = map;
            markerRef.current = marker;
            void reverseGeocode(initial[0], initial[1]);

            const teardown = () => {
                window.cancelAnimationFrame(frame);
                window.removeEventListener('resize', syncSize);
            };

            (map as any).__cleanup = teardown;
        };

        void init();

        return () => {
            disposed = true;
            if (mapRef.current) {
                mapRef.current.__cleanup?.();
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
    }, [initial, mounted, onChange]);

    useEffect(() => {
        if (!value || !markerRef.current || !mapRef.current) return;

        const pos = markerRef.current.getLatLng();
        const changed = Math.abs(pos.lat - value.lat) > 0.000001 || Math.abs(pos.lng - value.lng) > 0.000001;
        if (!changed) return;

        markerRef.current.setLatLng([value.lat, value.lng]);
        mapRef.current.setView([value.lat, value.lng], mapRef.current.getZoom(), { animate: false });
        mapRef.current.invalidateSize();
    }, [value]);

    if (!mounted) {
        return (
            <div
                className="flex w-full items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                style={{ height }}
            >
                <div className="flex flex-col items-center gap-2 text-[var(--color-hint)]">
                    <MapPin size={24} className="opacity-40" />
                    <span className="text-[12px]">Xarita yuklanmoqda...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-1.5">
            <div
                className="w-full overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-sm"
                style={{ height }}
            >
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            </div>
            {address && (
                <div className="flex items-center gap-1.5 px-1">
                    <MapPin size={11} className="flex-shrink-0 text-[var(--color-primary)]" />
                    <span className="truncate text-[11px] text-[var(--color-hint)]">{address}</span>
                </div>
            )}
            <p className="px-1 text-[10px] text-[var(--color-hint)]/60">
                Xaritaga bosib yoki marker surib aniq joyni belgilang
            </p>
        </div>
    );
}
