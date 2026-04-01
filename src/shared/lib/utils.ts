import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function resolveAssetUrl(url?: string | null): string | null {
    if (!url) return null;
    if (/^(data:|blob:|https?:\/\/)/i.test(url)) return url;
    if (typeof window === 'undefined') return url;
    return new URL(url, window.location.origin).toString();
}
