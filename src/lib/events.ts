import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var _adminEvents: EventEmitter | undefined;
}

export const adminEvents: EventEmitter =
  globalThis._adminEvents ?? new EventEmitter();

if (!globalThis._adminEvents) {
  adminEvents.setMaxListeners(200);
  globalThis._adminEvents = adminEvents;
}

export type AdminEventPayload =
  | { type: "users"; action: "created" | "updated" | "deleted" }
  | { type: "seller_requests"; action: "created" | "updated" }
  | { type: "products"; action: "created" | "updated" | "deleted" }
  | { type: "stores"; action: "created" | "updated" | "deleted" }
  | { type: "categories"; action: "created" | "updated" | "deleted" }
  | { type: "banners"; action: "created" | "updated" | "deleted" }
  | { type: "orders"; action: "created" | "updated" };

export function emitAdminEvent(payload: AdminEventPayload): void {
  adminEvents.emit("event", payload);
}
