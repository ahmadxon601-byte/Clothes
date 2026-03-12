-- Add multilingual name columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_uz VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- Populate translations from existing name
UPDATE categories SET name_uz = name, name_ru = name, name_en = name WHERE name_uz IS NULL;

-- Normalize seed categories with proper UZ/RU/EN translations.
UPDATE categories
SET
  name_uz = CASE slug
    WHEN 'accessories' THEN 'Aksessuarlar'
    WHEN 'dresses' THEN 'Liboslar'
    WHEN 'jackets' THEN 'Kurtkalar'
    WHEN 'outerwear' THEN 'Ustki kiyimlar'
    WHEN 'pants' THEN 'Shimlar'
    WHEN 'shirts' THEN 'Ko''ylaklar'
    WHEN 'shoes' THEN 'Oyoq kiyimlar'
    WHEN 'sportswear' THEN 'Sport kiyimlari'
    ELSE name_uz
  END,
  name_ru = CASE slug
    WHEN 'accessories' THEN U&'\0410\043A\0441\0435\0441\0441\0443\0430\0440\044B' -- Аксессуары
    WHEN 'dresses' THEN U&'\041F\043B\0430\0442\044C\044F' -- Платья
    WHEN 'jackets' THEN U&'\041A\0443\0440\0442\043A\0438' -- Куртки
    WHEN 'outerwear' THEN U&'\0412\0435\0440\0445\043D\044F\044F \043E\0434\0435\0436\0434\0430' -- Верхняя одежда
    WHEN 'pants' THEN U&'\0411\0440\044E\043A\0438' -- Брюки
    WHEN 'shirts' THEN U&'\0420\0443\0431\0430\0448\043A\0438' -- Рубашки
    WHEN 'shoes' THEN U&'\041E\0431\0443\0432\044C' -- Обувь
    WHEN 'sportswear' THEN U&'\0421\043F\043E\0440\0442\0438\0432\043D\0430\044F \043E\0434\0435\0436\0434\0430' -- Спортивная одежда
    ELSE name_ru
  END,
  name_en = CASE slug
    WHEN 'accessories' THEN 'Accessories'
    WHEN 'dresses' THEN 'Dresses'
    WHEN 'jackets' THEN 'Jackets'
    WHEN 'outerwear' THEN 'Outerwear'
    WHEN 'pants' THEN 'Pants'
    WHEN 'shirts' THEN 'Shirts'
    WHEN 'shoes' THEN 'Shoes'
    WHEN 'sportswear' THEN 'Sportswear'
    ELSE name_en
  END
WHERE slug IN ('accessories', 'dresses', 'jackets', 'outerwear', 'pants', 'shirts', 'shoes', 'sportswear');
