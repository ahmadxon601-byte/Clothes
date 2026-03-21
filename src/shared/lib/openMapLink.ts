export function openMapLink(lat: number, lng: number, label?: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
}
