# Deployment

## Required environment variables

Set these in production before starting the app:

- `DATABASE_URL`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `ADMIN_TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `ADMIN_TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_WEBAPP_URL`
- `URL`

Notes:

- This project now expects webhook secrets in production. Do not leave them empty.
- `/api/upload` requires persistent local storage or a mounted volume. Vercel-style ephemeral storage is not supported for production uploads.

You can start from [.env.production.example](/Users/said/Desktop/VSC/Clothes/.env.production.example).

## Build and run

```bash
npm ci
npm run build
npm run start
```

## Docker

```bash
docker compose build
docker compose up -d
```

With the current `docker-compose.yml`, the app is exposed on `3100` on the host:

```bash
http://127.0.0.1:3100
```

## Migrations

For an existing database, new SQL files in `migrations/` are not applied automatically.
Run them manually in order when deploying updates:

```bash
psql "$DATABASE_URL" -f migrations/009_seller_request_store_updates.sql
psql "$DATABASE_URL" -f migrations/012_product_views_unique.sql
psql "$DATABASE_URL" -f migrations/013_banner_image_url.sql
psql "$DATABASE_URL" -f migrations/014_banner_show_on_home.sql
```

## Health check

Use:

```bash
curl -sS http://127.0.0.1:3100/api/health
```

The endpoint now reports:

- app status
- database connectivity
- missing required env vars
