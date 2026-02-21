#!/bin/bash
# Netlify Build Script
set -e

echo "--- 🚀 Netlify Build Boshlandi ---"

# 1. Frontend Build
echo "📦 [1/3] Frontend qurilmoqda..."
npm run build -w frontend

# 2. Backend Build
echo "📦 [2/3] Backend qurilmoqda (TS tekshiruvi)..."
npm run build -w @clothes/backend

# 3. Output tayyorlash
echo "📁 [3/3] 'public' papkasi tayyorlanmoqda..."
mkdir -p public
if [ -d "apps/frontend/dist" ]; then
  cp -r apps/frontend/dist/. public/
  echo "✅ Frontend fayllari 'public'ga ko'chirildi."
else
  echo "❌ XATO: apps/frontend/dist topilmadi!"
  exit 1
fi

echo "--- ✨ Build Muvaffaqiyatli Yakunlandi ---"
