import type { Product, Store } from '../shared/types';

export const initialStores: Store[] = [
    {
        id: 'store-001',
        name: 'Milano Atelier',
        addressText: 'Amir Temur ko\'chasi 15, Toshkent',
        location: { lat: 41.2995, lng: 69.2401 },
        photoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
        status: 'ACTIVE',
    },
    {
        id: 'store-002',
        name: 'Urban Thread Co.',
        addressText: 'Yunusobod, 7-mavze, Toshkent',
        location: { lat: 41.3611, lng: 69.2836 },
        photoUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1200&auto=format&fit=crop',
        status: 'ACTIVE',
    },
    {
        id: 'store-003',
        name: 'Luxe Wardrobe',
        addressText: 'Chilonzor, 11-mavze, Toshkent',
        location: { lat: 41.2784, lng: 69.1883 },
        photoUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1200&auto=format&fit=crop',
        status: 'ACTIVE',
    },
    {
        id: 'store-004',
        name: 'Street Society',
        addressText: 'Mirzo Ulug\'bek tumani, Toshkent',
        location: { lat: 41.3398, lng: 69.3118 },
        photoUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
        status: 'ACTIVE',
    },
    {
        id: 'store-005',
        name: 'The Formal House',
        addressText: 'Shayxontohur, Eski shahar, Toshkent',
        location: { lat: 41.3243, lng: 69.2596 },
        photoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&auto=format&fit=crop',
        status: 'ACTIVE',
    },
    {
        id: 'store-006',
        name: 'Nomad Collective',
        addressText: 'Sergeli tumani, Toshkent',
        location: { lat: 41.2271, lng: 69.2043 },
        photoUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop',
        status: 'ACTIVE',
    },
];

export const initialProducts: Product[] = [
    // Milano Atelier
    { id: 'p-001', title: "Men's Camel Wool Overcoat", price: 1890000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'], category: 'Jackets', description: "Premium men's camel wool overcoat with clean tailoring.", storeId: 'store-001', brand: 'Milano' },
    { id: 'p-002', title: "Men's Silk Blend Dress Shirt", price: 540000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800'], category: 'Shirts', description: "Italian silk-blend dress shirt tailored for men.", storeId: 'store-001', brand: 'Milano' },
    { id: 'p-003', title: "Men's Slim Fit Trousers", price: 480000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800', 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800'], category: 'Pants', description: "Modern men's slim-fit trousers for formal and smart casual looks.", storeId: 'store-001', brand: 'Milano' },

    // Urban Thread
    { id: 'p-004', title: "Men's Oversized Hoodie", price: 390000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?q=80&w=800', 'https://images.unsplash.com/photo-1604695573706-53170668f6a6?q=80&w=800'], category: 'Hoodies', description: "Men's premium cotton oversized hoodie for everyday streetwear.", storeId: 'store-002', brand: 'Urban Thread' },
    { id: 'p-005', title: "Men's Graphic Tee - Cityscape", price: 220000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800'], category: 'T-Shirts', description: "Soft cotton men's graphic tee with urban city print.", storeId: 'store-002', brand: 'Urban Thread' },
    { id: 'p-006', title: "Men's Cargo Joggers", price: 340000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800'], category: 'Pants', description: "Relaxed-fit men's cargo joggers with utility pockets.", storeId: 'store-002', brand: 'Urban Thread' },

    // Luxe Wardrobe
    { id: 'p-007', title: "Men's Stainless Cuff Bracelet", price: 180000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800', 'https://images.unsplash.com/photo-1573408301185-9519f94de9e5?q=80&w=800'], category: 'Accessories', description: "Minimal men's stainless cuff bracelet with matte finish.", storeId: 'store-003', brand: 'Luxe' },
    { id: 'p-008', title: "Men's Leather Belt - Cognac", price: 290000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=800', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800'], category: 'Accessories', description: "Full-grain men's leather belt in cognac tone.", storeId: 'store-003', brand: 'Luxe' },
    { id: 'p-009', title: "Men's Knit Winter Scarf", price: 250000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800', 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=800'], category: 'Accessories', description: "Warm knit scarf designed for men's winter layering.", storeId: 'store-003', brand: 'Luxe' },

    // Street Society
    { id: 'p-010', title: "Men's Air Foam Sneakers", price: 890000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800'], category: 'Shoes', description: "Chunky men's air-foam sneakers built for street style.", storeId: 'store-004', brand: 'Street Society' },
    { id: 'p-011', title: "Men's Low-Top Canvas", price: 450000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'], category: 'Shoes', description: "Clean men's low-top canvas sneakers for daily wear.", storeId: 'store-004', brand: 'Street Society' },
    { id: 'p-012', title: "Men's Bomber Jacket", price: 790000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800'], category: 'Jackets', description: "Men's premium bomber jacket with embroidered details.", storeId: 'store-004', brand: 'Street Society' },

    // The Formal House
    { id: 'p-013', title: "Men's Wool Suit - Charcoal", price: 3200000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800'], category: 'Jackets', description: "Men's two-piece charcoal wool suit for formal occasions.", storeId: 'store-005', brand: 'Formal House' },
    { id: 'p-014', title: "Men's Oxford Dress Shoes", price: 1200000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'], category: 'Shoes', description: "Classic men's full-brogue oxford shoes in tan leather.", storeId: 'store-005', brand: 'Formal House' },
    { id: 'p-015', title: "Men's French Cuff Shirt", price: 620000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=800'], category: 'Shirts', description: "Men's white French cuff shirt for business and events.", storeId: 'store-005', brand: 'Formal House' },

    // Nomad Collective
    { id: 'p-016', title: "Men's Puffer Jacket - Sage", price: 980000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1548126032-079a0fb0099d?q=80&w=800', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800'], category: 'Jackets', description: "Lightweight men's puffer jacket in sage color.", storeId: 'store-006', brand: 'Nomad' },
    { id: 'p-017', title: "Men's Linen Button-Up", price: 320000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?q=80&w=800', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800'], category: 'Shirts', description: "Breathable men's linen button-up for warm weather.", storeId: 'store-006', brand: 'Nomad' },
    { id: 'p-018', title: "Men's Desert Trek Boots", price: 1150000, currency: 'UZS', images: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=800', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'], category: 'Shoes', description: "Rugged men's leather trek boots for outdoor use.", storeId: 'store-006', brand: 'Nomad' },
];
