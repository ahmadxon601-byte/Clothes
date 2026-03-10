'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Loader2 } from 'lucide-react';

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
    return null;
}

type Props = {
    initialLat?: number;
    initialLng?: number;
    onConfirm: (formatted: string) => void;
    onClose: () => void;
    /** Render as inline map (no fullscreen overlay, no header/footer). Fires onChange on each pin change. */
    embedded?: boolean;
    onChange?: (formatted: string) => void;
};

export function MapPickerLeaflet({ initialLat = 41.2995, initialLng = 69.2401, onConfirm, onClose, embedded, onChange }: Props) {
    const hasInitialPin = initialLat !== 41.2995 || initialLng !== 69.2401;
    const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
        hasInitialPin ? { lat: initialLat, lng: initialLng } : null
    );
    const [addressLabel, setAddressLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const mapRef = useRef<L.Map | null>(null);
    const [mapKey] = useState(() => `${embedded ? 'embedded' : 'modal'}-${Math.random().toString(36).slice(2)}`);

    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setMounted(true);
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const handlePick = async (lat: number, lng: number) => {
        setPin({ lat, lng });
        if (embedded) {
            setAddressLabel('');
            setLoading(true);
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
            } catch { /* ignore */ }
            setLoading(false);
            setAddressLabel(displayName);
            const formatted = displayName
                ? `${displayName} Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                : `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onChange?.(formatted);
            onConfirm(formatted);
        }
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
        } catch { /* ignore */ }
        setLoading(false);
        const formatted = addressText
            ? `${addressText} Coordinates: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`
            : `Coordinates: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`;
        onConfirm(formatted);
    };

    if (!mounted) return null;

    if (embedded) {
        return (
            <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10" style={{ height: 260, position: 'relative' }}>
                <MapContainer
                    key={mapKey}
                    center={[pin?.lat ?? initialLat, pin?.lng ?? initialLng]}
                    zoom={14}
                    attributionControl={false}
                    whenReady={(e) => { mapRef.current = e.target; }}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
                    />
                    <ClickHandler onPick={handlePick} />
                    {pin && <Marker position={[pin.lat, pin.lng]} />}
                </MapContainer>
                {!pin && (
                    <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none z-[400]">
                        <span className="bg-black/70 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full">
                            Xaritaga bosib joy tanlang
                        </span>
                    </div>
                )}
                {pin && (
                    <div className="absolute bottom-0 inset-x-0 z-[400] flex items-center gap-1.5 bg-white/90 dark:bg-[#1a1a1a]/90 px-3 py-2 backdrop-blur-sm pointer-events-none">
                        {loading
                            ? <Loader2 size={11} className="shrink-0 animate-spin text-[#00a645]" />
                            : <MapPin size={11} className="shrink-0 text-[#00a645]" />}
                        <span className="text-[11px] text-[#374151] dark:text-[#d1d5db] truncate">
                            {loading ? 'Manzil aniqlanmoqda...' : (addressLabel || `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`)}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[300] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-[#1a1a1a] z-10">
                <h3 className="text-[15px] font-bold text-[#111111] dark:text-white">Joylashuvni tanlang</h3>
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-[#6b7280] dark:border-white/10 dark:text-[#9ca3af]"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    key={mapKey}
                    center={[pin?.lat ?? initialLat, pin?.lng ?? initialLng]}
                    zoom={13}
                    attributionControl={false}
                    whenReady={(e) => { mapRef.current = e.target; }}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
                    />
                    <ClickHandler onPick={handlePick} />
                    {pin && <Marker position={[pin.lat, pin.lng]} />}
                </MapContainer>
                {!pin && (
                    <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none z-[400]">
                        <span className="bg-black/70 text-white text-[13px] font-semibold px-4 py-2 rounded-full">
                            Xaritaga bosib joy tanlang
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
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
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#00c853] text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] disabled:opacity-50"
                >
                    {loading && <Loader2 size={13} className="animate-spin" />}
                    {loading ? "Manzil aniqlanmoqda..." : "Tasdiqlash"}
                </button>
            </div>
        </div>
    );
}
