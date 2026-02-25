import type { Product, Store } from '../shared/types';

export const initialStores: Store[] = [
    {
        id: 'store_1',
        name: 'Tashkent Premium Brands',
        addressText: 'Amir Temur street 12, Tashkent',
        location: { lat: 41.311081, lng: 69.240562 },
        photoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
        status: 'ACTIVE',
    },
    {
        id: 'store_2',
        name: 'Urban Streetwear',
        addressText: 'Chilonzor 3, Tashkent',
        location: { lat: 41.282924, lng: 69.213264 },
        photoUrl: 'https://images.unsplash.com/photo-1555529771-835f59bfc50c?w=400&q=80',
        status: 'ACTIVE',
    }
];

export const initialProducts: Product[] = [
    {
        id: 'p1',
        title: 'Minimalist White T-Shirt',
        price: 150000,
        currency: 'UZS',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'],
        category: 'T-Shirts',
        description: '100% premium cotton standard fit pure white t-shirt. Ideal for everyday use.',
        storeId: 'store_1',
    },
    {
        id: 'p2',
        title: 'Classic Denim Jacket',
        price: 450000,
        currency: 'UZS',
        images: ['https://images.unsplash.com/photo-1495105787522-5334e3ffa0e7?w=400&q=80'],
        category: 'Jackets',
        description: 'Vintage blue wash denim jacket with standard collar and button fastenings.',
        storeId: 'store_1',
    },
    {
        id: 'p3',
        title: 'Urban Black Hoodie',
        price: 250000,
        currency: 'UZS',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80'],
        category: 'Hoodies',
        description: 'Heavyweight oversized soft black hoodie. Perfect for cold streetwear.',
        storeId: 'store_2',
    },
    {
        id: 'p4',
        title: 'Cargo Pants Olive',
        price: 350000,
        currency: 'UZS',
        images: ['https://images.unsplash.com/photo-1624378439575-d1ead6bb0446?w=400&q=80'],
        category: 'Pants',
        description: 'Durable cotton-canvas straight-leg cargo pants with 6 pockets.',
        storeId: 'store_2',
    }
];
