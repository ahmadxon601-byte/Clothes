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
    id: "nike-air-zoom",
    name: "Nike Air Zoom",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    size: "42",
    color: "Red",
    price: 140,
    quantity: 1
  },
  {
    id: "grey-casual-shoe",
    name: "Grey Casual Shoe",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    size: "L",
    color: "Grey",
    price: 120,
    quantity: 1
  },
  {
    id: "minimalist-watch",
    name: "Minimalist Watch",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
    size: "Uni",
    color: "White",
    price: 85,
    quantity: 1
  }
];

export const mockUserProfile: UserProfile = {
  fullName: "Guest User",
  phone: "+998 90 000 00 00",
  email: "guest@example.com"
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
        id: "grey-casual-shoe",
        name: "Grey Casual Shoe",
        quantity: 1,
        price: 120
      }
    ],
    subtotal: 120,
    shipping: 15,
    total: 135
  }
];

export const mockNotifications: MarketplaceNotification[] = [
  {
    id: "not-1",
    title: "Order Update",
    body: "Your last order has been delivered.",
    createdAt: "2026-01-16T09:00:00.000Z",
    read: false
  },
  {
    id: "not-2",
    title: "Limited Offer",
    body: "New arrivals are now available with limited discounts.",
    createdAt: "2026-01-17T08:30:00.000Z",
    read: true
  }
];
