import { mockCategories } from "@/src/data/mockCategories";
import { mockProducts } from "@/src/data/mockProducts";
import type {
  CartItem,
  MarketplaceNotification,
  Order,
  UserProfile,
  UserSettings
} from "@/src/types/marketplace";

export { mockCategories, mockProducts };

export const mockCartItems: CartItem[] = [
  {
    id: "street-sneaker",
    name: "Street krossovka",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    size: "42",
    color: "Qizil",
    price: 359000,
    quantity: 1
  },
  {
    id: "daily-jacket",
    name: "Kundalik kurtka",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    size: "L",
    color: "Kulrang",
    price: 289000,
    quantity: 1
  },
  {
    id: "urban-watch",
    name: "Urban soat",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
    size: "Uni",
    color: "Oq",
    price: 189000,
    quantity: 1
  }
];

export const mockUserProfile: UserProfile = {
  fullName: "Qulaymarket Mijoz",
  phone: "+998 90 000 00 00",
  email: "buyer@example.com"
};

export const mockUserSettings: UserSettings = {
  language: "en",
  marketingEmails: true,
  orderUpdates: true
};

export const mockOrders: Order[] = [
  {
    id: "ord-1001",
    createdAt: "2026-01-15T12:00:00.000Z",
    status: "completed",
    items: [
      {
        id: "street-sneaker",
        name: "Street krossovka",
        quantity: 1,
        price: 359000
      }
    ],
    subtotal: 359000,
    shipping: 0,
    total: 359000
  }
];

export const mockNotifications: MarketplaceNotification[] = [
  {
    id: "not-1",
    title: "Buyurtma yangilandi",
    body: "Oxirgi buyurtmangiz muvaffaqiyatli yetkazildi.",
    createdAt: "2026-01-16T09:00:00.000Z",
    read: false
  },
  {
    id: "not-2",
    title: "Kun aksiyasi",
    body: "Saralangan mahsulotlarda foydali narxlar yangilandi.",
    createdAt: "2026-01-17T08:30:00.000Z",
    read: true
  }
];
