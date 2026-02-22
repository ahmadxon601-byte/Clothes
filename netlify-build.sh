#!/bin/bash
# Netlify Build Script (Frontend Only)
set -e

echo "--- 🚀 Netlify Build Boshlandi (Frontend Only) ---"

# 1. Frontend Build
echo "📦 [1/1] Frontend qurilmoqda..."
npm run build -w frontend

echo "--- ✨ Build Muvaffaqiyatli Yakunlandi ---"
