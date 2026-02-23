export interface Product {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    category: string;
    description: string;
    storeId: string;
    brand?: string;
}

export interface Store {
    id: string;
    name: string;
    addressText: string;
    location: { lat: number; lng: number };
    photoUrl: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface Comment {
    id: string;
    productId: string;
    userId: string;
    text: string;
    createdAt: string;
}

export interface StoreApplication {
    id: string;
    userId: string;
    storeName: string;
    addressText: string;
    location: { lat: number; lng: number };
    photoUrl: string;
    status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Settings {
    themeMode: 'auto' | 'light' | 'dark';
    language?: 'uz' | 'ru' | 'en';
}

export interface UserInfo {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
}
