import { mockProducts } from "@/src/data/mockProducts";
import { readStorageJson, STORAGE_KEYS, writeStorageJson } from "@/src/lib/storage";
import { ordersService } from "@/src/services/orders.service";
import type { Order, SellerProduct, SellerPromotion, SellerSettings } from "@/src/types/marketplace";

const defaultSellerProducts: SellerProduct[] = mockProducts.map((item, index) => ({
  id: `sp-${item.id}`,
  name: item.name,
  price: item.price,
  stock: 8 + index * 3,
  category: item.category ?? "general",
  image: item.image,
  active: true
}));

const defaultPromotions: SellerPromotion[] = [
  {
    id: "promo-1",
    title: "Yangi mijoz chegirmasi",
    code: "WELCOME10",
    discountPercent: 10,
    active: true
  },
  {
    id: "promo-2",
    title: "Hafta oxiri aksiyasi",
    code: "FLASH15",
    discountPercent: 15,
    active: false
  }
];

const defaultSettings: SellerSettings = {
  shopName: "Qulaymarket Seller Studio",
  supportPhone: "+998 90 111 22 33",
  autoConfirmOrders: false
};

let productsMemory = [...defaultSellerProducts];
let promotionsMemory = [...defaultPromotions];
let settingsMemory = { ...defaultSettings };

const readProducts = () => {
  const products = readStorageJson<SellerProduct[]>(STORAGE_KEYS.sellerProducts, productsMemory);
  productsMemory = [...products];
  return [...products];
};

const writeProducts = (products: SellerProduct[]) => {
  productsMemory = [...products];
  writeStorageJson(STORAGE_KEYS.sellerProducts, products);
};

const readPromotions = () => {
  const promotions = readStorageJson<SellerPromotion[]>(
    STORAGE_KEYS.sellerPromotions,
    promotionsMemory
  );
  promotionsMemory = [...promotions];
  return [...promotions];
};

const writePromotions = (promotions: SellerPromotion[]) => {
  promotionsMemory = [...promotions];
  writeStorageJson(STORAGE_KEYS.sellerPromotions, promotions);
};

const readSettings = () => {
  const settings = readStorageJson<SellerSettings>(STORAGE_KEYS.sellerSettings, settingsMemory);
  settingsMemory = { ...settings };
  return { ...settings };
};

const writeSettings = (settings: SellerSettings) => {
  settingsMemory = { ...settings };
  writeStorageJson(STORAGE_KEYS.sellerSettings, settings);
};

export const sellerService = {
  listProducts() {
    return readProducts();
  },

  createProduct(input: Omit<SellerProduct, "id">) {
    const next: SellerProduct = {
      ...input,
      id: `sp-${Date.now()}`
    };
    const products = [next, ...readProducts()];
    writeProducts(products);
    return next;
  },

  setProductActive(productId: string, active: boolean) {
    const products = readProducts().map((product) =>
      product.id === productId ? { ...product, active } : product
    );
    writeProducts(products);
    return products;
  },

  listPromotions() {
    return readPromotions();
  },

  createPromotion(input: Omit<SellerPromotion, "id">) {
    const promotion: SellerPromotion = {
      ...input,
      id: `promo-${Date.now()}`
    };
    const promotions = [promotion, ...readPromotions()];
    writePromotions(promotions);
    return promotion;
  },

  setPromotionActive(promotionId: string, active: boolean) {
    const promotions = readPromotions().map((promotion) =>
      promotion.id === promotionId ? { ...promotion, active } : promotion
    );
    writePromotions(promotions);
    return promotions;
  },

  async listOrders(): Promise<Order[]> {
    return ordersService.list();
  },

  getSettings() {
    return readSettings();
  },

  saveSettings(settings: SellerSettings) {
    writeSettings(settings);
    return settings;
  }
};
