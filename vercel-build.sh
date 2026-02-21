#!/bin/bash
set -e
echo "🚀 Vercel Build Script boshlandi..."

# 1. Workspace-larni qurish
echo "📦 Frontend build qilinmoqda..."
npm run build -w frontend

echo "📦 Backend build qilinmoqda..."
npm run build -w @clothes/backend

# 2. Output papkasini tayyorlash
echo "📁 'public' papkasi tayyorlanmoqda..."
rm -rf public
mkdir -p public

# 3. Fayllarni nusxalash
if [ -d "apps/frontend/dist" ]; then
    echo "✅ Frontend dist topildi, nusxalanmoqda..."
    cp -r apps/frontend/dist/. public/
else
    echo "❌ XATO: apps/frontend/dist topilmadi!"
    exit 1
fi

# 4. Tekshiruv
echo "📊 Yakuniy fayllar:"
ls -la public

echo "✅ Build muvaffaqiyatli yakunlandi!"
