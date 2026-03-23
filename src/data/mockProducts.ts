import type { Product } from "@/src/types/marketplace";

export const mockProducts: Product[] = [
  {
    id: "daily-jacket",
    name: "Kundalik kurtka",
    price: 289000,
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1000&q=80",
    category: "popular",
    description: "Har kuni kiyishga mos, qulay va amaliy model."
  },
  {
    id: "street-sneaker",
    name: "Street krossovka",
    price: 359000,
    image: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?w=1000&q=80",
    category: "footwear",
    description: "Yengil taglik va yumshoq qulaylik bilan kundalik yurish uchun."
  },
  {
    id: "basic-tee",
    name: "Basic futbolka",
    price: 99000,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80",
    category: "daily-deals",
    description: "Yumshoq paxtali mato va universal fason bilan ommabop tanlov."
  },
  {
    id: "urban-watch",
    name: "Urban soat",
    price: 189000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1000&q=80",
    category: "accessories",
    description: "Soddaligi va kundalik uslubga mos ko'rinishi bilan ajralib turadi."
  }
];
