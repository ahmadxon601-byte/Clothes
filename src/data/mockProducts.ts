import type { Product } from "@/src/types/marketplace";

export const mockProducts: Product[] = [
  {
    id: "brown-harrington",
    name: "Brown Harrington",
    price: 210,
    image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=1000&q=80",
    category: "windbreaker",
    description: "Lightweight outer layer with a clean and timeless silhouette."
  },
  {
    id: "grey-casual-shoe",
    name: "Grey Casual Shoe",
    price: 120,
    image: "https://images.unsplash.com/photo-1505685296765-3a2736de412f?w=1000&q=80",
    category: "footwears",
    description: "Daily-wear sneaker with a breathable upper and soft cushioning."
  },
  {
    id: "essential-white-tee",
    name: "Essential White Tee",
    price: 45,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80",
    category: "shirts",
    description: "Cotton tee with a relaxed fit for everyday layering."
  },
  {
    id: "blue-slim-cenim",
    name: "Blue Slim Cenim",
    price: 89,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1000&q=80",
    category: "shirts",
    description: "Stretch denim in a slim profile with balanced comfort."
  }
];
