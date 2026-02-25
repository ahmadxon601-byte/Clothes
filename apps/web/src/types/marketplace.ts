export type Category = {
  id: string;
  slug?: string;
  name: string;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
  stock?: number;
};

export type CartItem = {
  id: string;
  name: string;
  image: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
};

export type UserProfile = {
  fullName: string;
  phone: string;
  email: string;
};

export type UserSettings = {
  language: "en" | "uz";
  marketingEmails: boolean;
  orderUpdates: boolean;
};

export type OrderLine = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export type OrderStatus = "pending" | "paid" | "shipped" | "completed";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

export type MarketplaceNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type SellerProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  active: boolean;
};

export type SellerPromotion = {
  id: string;
  title: string;
  code: string;
  discountPercent: number;
  active: boolean;
};

export type SellerSettings = {
  shopName: string;
  supportPhone: string;
  autoConfirmOrders: boolean;
};
