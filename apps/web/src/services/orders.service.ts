import { apiGet, apiPost } from "@/src/lib/api";
import { readStorageJson, STORAGE_KEYS, writeStorageJson } from "@/src/lib/storage";
import { cartService } from "@/src/services/cart.service";
import { mockOrders } from "@/src/services/mock-data";
import type { Order, OrderLine } from "@/src/types/marketplace";

let memoryOrders: Order[] = mockOrders.map((order) => ({ ...order, items: [...order.items] }));

const isOrderLine = (value: unknown): value is OrderLine => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const line = value as Partial<OrderLine>;
  return (
    typeof line.id === "string" &&
    typeof line.name === "string" &&
    typeof line.quantity === "number" &&
    typeof line.price === "number"
  );
};

const isOrder = (value: unknown): value is Order => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const order = value as Partial<Order>;
  return (
    typeof order.id === "string" &&
    typeof order.createdAt === "string" &&
    typeof order.status === "string" &&
    Array.isArray(order.items) &&
    order.items.every(isOrderLine) &&
    typeof order.subtotal === "number" &&
    typeof order.shipping === "number" &&
    typeof order.total === "number"
  );
};

const cloneOrders = (orders: Order[]) =>
  orders.map((order) => ({
    ...order,
    items: order.items.map((line) => ({ ...line }))
  }));

const sanitizeOrders = (value: unknown): Order[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isOrder);
};

const readOrdersFromStorage = () => {
  const stored = readStorageJson<unknown>(STORAGE_KEYS.orders, memoryOrders);
  const orders = sanitizeOrders(stored);
  memoryOrders = cloneOrders(orders);
  return cloneOrders(orders);
};

const writeOrders = (orders: Order[]) => {
  memoryOrders = cloneOrders(orders);
  writeStorageJson(STORAGE_KEYS.orders, orders);
};

export const ordersService = {
  async list(): Promise<Order[]> {
    try {
      const payload = await apiGet<unknown>("/api/orders");
      const fromArray = sanitizeOrders(payload);
      if (fromArray.length) {
        writeOrders(fromArray);
        return cloneOrders(fromArray);
      }

      if (payload && typeof payload === "object") {
        const record = payload as Record<string, unknown>;
        const nested = sanitizeOrders(record.orders ?? record.items ?? record.data);
        if (nested.length) {
          writeOrders(nested);
          return cloneOrders(nested);
        }
      }
    } catch {
      // Use local fallback when API is unavailable.
    }

    return readOrdersFromStorage();
  },

  async createFromCart(): Promise<Order | null> {
    const cartItems = cartService.list();
    if (!cartItems.length) {
      return null;
    }

    const summary = cartService.summary(cartItems);
    const order: Order = {
      id: `ord-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: summary.subtotal,
      shipping: summary.shipping,
      total: summary.total
    };

    const nextOrders = [order, ...readOrdersFromStorage()];
    writeOrders(nextOrders);
    cartService.clear();

    try {
      await apiPost<unknown, Order>("/api/orders", order);
    } catch {
      // Keep local fallback when API is unavailable.
    }

    return order;
  }
};
