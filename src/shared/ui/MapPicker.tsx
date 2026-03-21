'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// Namangan city center
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
    const [mounted, setMounted] = useState(false);
    const [address, setAddress] = useState<string>('');

    const initial: [number, number] = value
        ? [value.lat, value.lng]
        : NAMANGAN;

    // Reverse geocode using Nominatim (free, no key)
    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`,
                { headers: { 'User-Agent': 'AksiyaUz/1.0' } }
            );
            const data = await res.json();
            const parts = [
                data.address?.road || data.address?.pedestrian || data.address?.suburb,
                data.address?.city || data.address?.town || data.address?.county,
            ].filter(Boolean);
            setAddress(parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || '');
        } catch {
            setAddress('');
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !containerRef.current) return;
        if (mapRef.current) return; // already initialized

        let L: any;

        const init = async () => {
            L = (await import('leaflet')).default;

            // Fix default icon paths
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            if (!containerRef.current || mapRef.current) return;

            const map = L.map(containerRef.current, {
                center: initial,
                zoom: 13,
                zoomControl: true,
                attributionControl: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            const marker = L.marker(initial, { draggable: true }).addTo(map);

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                onChange({ lat: pos.lat, lng: pos.lng });
                reverseGeocode(pos.lat, pos.lng);
            });

            map.on('click', (e: any) => {
                marker.setLatLng(e.latlng);
                onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
                reverseGeocode(e.latlng.lat, e.latlng.lng);
            });

            mapRef.current = map;
            markerRef.current = marker;

            reverseGeocode(initial[0], initial[1]);
        };

        init();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    // Update marker when value prop changes externally
    useEffect(() => {
        if (!markerRef.current || !value) return;
        const pos = markerRef.current.getLatLng();
        if (Math.abs(pos.lat - value.lat) > 0.0001 || Math.abs(pos.lng - value.lng) > 0.0001) {
            markerRef.current.setLatLng([value.lat, value.lng]);
            mapRef.current?.setView([value.lat, value.lng], 13);
        }
    }, [value]);

    if (!mounted) {
        return (
            <div
                className="w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center"
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
        <div className="w-full flex flex-col gap-1.5">
            <div
                className="w-full rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm"
                style={{ height }}
            >
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            </div>
            {address && (
                <div className="flex items-center gap-1.5 px-1">
                    <MapPin size={11} className="text-[var(--color-primary)] flex-shrink-0" />
                    <span className="text-[11px] text-[var(--color-hint)] truncate">{address}</span>
                </div>
            )}
            <p className="text-[10px] text-[var(--color-hint)]/60 px-1">
                Xaritaga bosib yoki marker sürüklab aniq joyni belgilang
            </p>
        </div>
    );
}
