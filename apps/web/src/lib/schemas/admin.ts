import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  pages: z.number(),
});

export const statusSchema = z.enum(['pending', 'approved', 'rejected', 'blocked', 'active', 'inactive']);

export const applicationSchema = z.object({
  id: z.string(),
  user_name: z.string().default(''),
  user_email: z.string().default(''),
  store_name: z.string().default(''),
  store_description: z.string().nullish(),
  store_phone: z.string().nullish(),
  store_address: z.string().nullish(),
  status: z.string().default('pending'),
  created_at: z.string(),
});

export const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  owner_name: z.string().default(''),
  owner_email: z.string().default(''),
  is_active: z.boolean().default(true),
  product_count: z.number().default(0),
  created_at: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().default(''),
  price: z.number().optional(),
  base_price: z.number().optional(),
  old_price: z.number().nullish(),
  views: z.number().default(0),
  is_active: z.boolean().default(true),
  category_name: z.string().nullish(),
  store_name: z.string().nullish(),
  thumbnail: z.string().url().nullish(),
  created_at: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  email: z.string(),
  role: z.string(),
  is_banned: z.boolean().optional(),
  created_at: z.string(),
});

export const orderSchema = z.object({
  id: z.string(),
  status: z.string(),
  total_price: z.number(),
  address: z.string().nullish(),
  created_at: z.string(),
  user_name: z.string().default(''),
  user_email: z.string().default(''),
  items_count: z.number().default(0),
});

export const statsSchema = z.object({
  users_count: z.number().default(0),
  products_count: z.number().default(0),
  stores_count: z.number().default(0),
  pending_seller_requests: z.number().default(0),
});

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  email: z.string(),
  role: z.string(),
});

export type Pagination = z.infer<typeof paginationSchema>;
export type Application = z.infer<typeof applicationSchema>;
export type StoreItem = z.infer<typeof storeSchema>;
export type Product = z.infer<typeof productSchema>;
export type User = z.infer<typeof userSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Stats = z.infer<typeof statsSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
