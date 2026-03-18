'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = { lat: number; lng: number; height?: number };

export function MapDisplay({ lat, lng, height = 150 }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setMounted(true);
    }, []);

    if (!mounted) return <div style={{ height, width: '100%' }} className="bg-[#f3f4f6] dark:bg-[#1a1a1a] animate-pulse" />;

    return (
        <div style={{ height, width: '100%', isolation: 'isolate', position: 'relative', zIndex: 0 }}>
            <MapContainer
                center={[lat, lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]} />
            </MapContainer>
        </div>
    );
}
