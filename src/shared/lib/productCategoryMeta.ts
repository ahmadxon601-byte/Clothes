export type DepartmentKey = 'electronics' | 'food' | 'furniture';

export const DEPARTMENTS: Array<{
  key: DepartmentKey;
  label: string;
  description: string;
}> = [
  { key: 'electronics', label: 'Texnika', description: 'Telefon, noutbuk va elektronika' },
  { key: 'food', label: "Oziq-ovqat", description: 'Ichimlik, yegulik va oziq-ovqat mahsulotlari' },
  { key: 'furniture', label: 'Mebel', description: 'Uy va ofis uchun mebel turlari' },
];

const DEPARTMENT_SLUGS: Record<DepartmentKey, string[]> = {
  electronics: [
    'smartphones',
    'laptops',
    'tablets',
    'headphones',
    'tv-audio',
    'home-appliances',
    'cameras',
    'gaming',
    'smart-devices',
  ],
  food: [
    'beverages',
    'snacks',
    'dairy',
    'bakery',
    'fruits-vegetables',
    'meat-frozen',
    'sweets',
    'groceries',
  ],
  furniture: [
    'beds',
    'sofas',
    'tables',
    'chairs',
    'wardrobes',
    'office-furniture',
  ],
};

const VARIANT_META: Record<DepartmentKey, { label: string; placeholder: string; options: string[] }> = {
  electronics: {
    label: 'Konfiguratsiya',
    placeholder: 'Konfiguratsiya tanlang',
    options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', 'Wi-Fi', 'Pro', 'Max', 'Standart'],
  },
  food: {
    label: "Og'irlik / Hajm",
    placeholder: "Og'irlik yoki hajmni tanlang",
    options: ['250 g', '500 g', '1 kg', '1.5 kg', '330 ml', '500 ml', '1 L', '1.5 L', '2 L'],
  },
  furniture: {
    label: "O'lcham / Turi",
    placeholder: "Mebel turini tanlang",
    options: ['Kichik', "O'rta", 'Katta', 'Bir kishilik', 'Ikki kishilik', 'Standart'],
  },
};

export function getDepartmentBySlug(slug?: string | null): DepartmentKey {
  if (!slug) return 'electronics';
  const normalized = slug.toLowerCase();
  for (const [key, slugs] of Object.entries(DEPARTMENT_SLUGS) as Array<[DepartmentKey, string[]]>) {
    if (slugs.includes(normalized)) return key;
  }
  return 'electronics';
}

export function getVariantMeta(department: DepartmentKey) {
  return VARIANT_META[department];
}
