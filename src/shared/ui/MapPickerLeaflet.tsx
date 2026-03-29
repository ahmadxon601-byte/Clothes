'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LeafletEventHandlerFnMap } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, X } from 'lucide-react';

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
    return null;
}

function MapLifecycle({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();

    useEffect(() => {
        const syncSize = () => map.invalidateSize();

        syncSize();
        const frame = window.requestAnimationFrame(syncSize);
        window.addEventListener('resize', syncSize);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('resize', syncSize);
        };
    }, [map]);

    useEffect(() => {
        map.setView([lat, lng], map.getZoom(), { animate: false });
        map.invalidateSize();
    }, [lat, lng, map]);

    return null;
}

function DraggableMarker({
    pin,
    onPick,
}: {
    pin: { lat: number; lng: number };
    onPick: (lat: number, lng: number) => void;
}) {
    const eventHandlers = useRef<LeafletEventHandlerFnMap>({
        dragend: (event) => {
            const marker = event.target as L.Marker;
            const point = marker.getLatLng();
            onPick(point.lat, point.lng);
        },
    });

    return <Marker position={[pin.lat, pin.lng]} draggable eventHandlers={eventHandlers.current} />;
}

type Props = {
    initialLat?: number;
    initialLng?: number;
    onConfirm: (formatted: string) => void;
    onClose: () => void;
    embedded?: boolean;
    onChange?: (formatted: string) => void;
};

const DEFAULT_LAT = 41.0011;
const DEFAULT_LNG = 71.6681;

export function MapPickerLeaflet({ initialLat = DEFAULT_LAT, initialLng = DEFAULT_LNG, onConfirm, onClose, embedded, onChange }: Props) {
    const hasInitialPin = initialLat !== DEFAULT_LAT || initialLng !== DEFAULT_LNG;
    const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
        hasInitialPin ? { lat: initialLat, lng: initialLng } : null
    );
    const [addressLabel, setAddressLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mapKey] = useState(() => `${embedded ? 'embedded' : 'modal'}-${Math.random().toString(36).slice(2)}`);
    const latestRequestRef = useRef(0);

    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setMounted(true);
    }, []);

    useEffect(() => {
        if (hasInitialPin) {
            setPin({ lat: initialLat, lng: initialLng });
            return;
        }

        setPin(null);
    }, [hasInitialPin, initialLat, initialLng]);

    const formatSelection = (lat: number, lng: number, addressText = '') =>
        addressText
            ? `${addressText} Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            : `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    const handlePick = async (lat: number, lng: number) => {
        setPin({ lat, lng });

        if (!embedded) return;

        const requestId = latestRequestRef.current + 1;
        latestRequestRef.current = requestId;

        setAddressLabel('');
        setLoading(true);
        onChange?.(formatSelection(lat, lng));

        let displayName = '';

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'uz,ru,en' } }
            );
            const data = await res.json();
            displayName = data.display_name ?? '';
            const addr = data.address ?? {};
            const parts = [
                addr.road || addr.pedestrian || addr.footway,
                addr.house_number,
                addr.neighbourhood || addr.suburb,
                addr.city || addr.town || addr.village || addr.county,
            ].filter(Boolean);
            displayName = parts.length ? parts.join(', ') : displayName;
        } catch {
            // Reverse geocode failure should not block choosing coordinates.
        }

        const formatted = formatSelection(lat, lng, displayName);

        if (latestRequestRef.current !== requestId) return;

        setLoading(false);
        setAddressLabel(displayName);
        onChange?.(formatted);
        onConfirm(formatted);
    };

    const handleConfirm = async () => {
        if (!pin) return;

        setLoading(true);
        let addressText = '';

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${pin.lat}&lon=${pin.lng}&format=json`,
                { headers: { 'Accept-Language': 'uz,ru,en' } }
            );
            const data = await res.json();
            addressText = data.display_name ?? '';
        } catch {
            // Ignore and keep raw coordinates.
        }

        setLoading(false);

        const formatted = formatSelection(pin.lat, pin.lng, addressText);

        onConfirm(formatted);
    };

    if (!mounted) return null;

    const activeLat = pin?.lat ?? initialLat;
    const activeLng = pin?.lng ?? initialLng;

    if (embedded) {
        return (
            <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10" style={{ height: 260, position: 'relative' }}>
                <MapContainer
                    key={mapKey}
                    center={[activeLat, activeLng]}
                    zoom={14}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapLifecycle lat={activeLat} lng={activeLng} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="OpenStreetMap contributors"
                    />
                    <ClickHandler onPick={handlePick} />
                    {pin && <DraggableMarker pin={pin} onPick={handlePick} />}
                </MapContainer>
                {!pin && (
                    <div className="absolute inset-x-0 bottom-4 z-[400] flex justify-center pointer-events-none">
                        <span className="rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-semibold text-white">
                            Xaritaga bosib joy tanlang
                        </span>
                    </div>
                )}
                {pin && (
                    <div className="absolute bottom-0 inset-x-0 z-[400] flex items-center gap-1.5 bg-white/90 px-3 py-2 backdrop-blur-sm pointer-events-none dark:bg-[#1a1a1a]/90">
                        {loading
                            ? <Loader2 size={11} className="shrink-0 animate-spin text-[#00a645]" />
                            : <MapPin size={11} className="shrink-0 text-[#00a645]" />}
                        <span className="truncate text-[11px] text-[#374151] dark:text-[#d1d5db]">
                            {loading ? 'Manzil aniqlanmoqda...' : (addressLabel || `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`)}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] flex flex-col">
            <div className="z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-[#1a1a1a]">
                <h3 className="text-[15px] font-bold text-[#111111] dark:text-white">Joylashuvni tanlang</h3>
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[#6b7280] dark:border-white/10 dark:text-[#9ca3af]"
                >
                    <X size={15} />
                </button>
            </div>

            <div className="relative flex-1">
                <MapContainer
                    key={mapKey}
                    center={[activeLat, activeLng]}
                    zoom={13}
                    attributionControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <MapLifecycle lat={activeLat} lng={activeLng} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="OpenStreetMap contributors"
                    />
                    <ClickHandler onPick={handlePick} />
                    {pin && <DraggableMarker pin={pin} onPick={handlePick} />}
                </MapContainer>
                {!pin && (
                    <div className="absolute inset-x-0 bottom-6 z-[400] flex justify-center pointer-events-none">
                        <span className="rounded-full bg-black/70 px-4 py-2 text-[13px] font-semibold text-white">
                            Xaritaga bosib joy tanlang
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-white p-4 dark:bg-[#1a1a1a]">
                {pin && (
                    <p className="mb-3 flex items-center gap-1.5 text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                        <MapPin size={12} className="text-[#00a645]" />
                        {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                    </p>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={!pin || loading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#13ec37] text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] disabled:opacity-50"
                >
                    {loading && <Loader2 size={13} className="animate-spin" />}
                    {loading ? 'Manzil aniqlanmoqda...' : 'Tasdiqlash'}
                </button>
            </div>
        </div>
    );
}
