-- Add multilingual name columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_uz VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

-- Populate translations from existing name
UPDATE categories SET name_uz = name, name_ru = name, name_en = name WHERE name_uz IS NULL;
