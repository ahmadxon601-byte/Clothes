-- Add "Looks" category (sets: 2-piece / 3-piece outfits)
INSERT INTO categories (name, slug, name_uz, name_ru, name_en)
VALUES (
  'Looks',
  'looks',
  'Looklar (2 lik / 3 lik)',
  U&'\041A\043E\043C\043F\043B\0435\043A\0442\044B (2-\043A\0430 / 3-\043A\0430)',
  'Looks (2-piece / 3-piece)'
)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  name_uz = EXCLUDED.name_uz,
  name_ru = EXCLUDED.name_ru,
  name_en = EXCLUDED.name_en;
