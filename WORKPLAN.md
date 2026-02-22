# WORKPLAN

## Audit (Safety-First)

### DO NOT TOUCH (existing working parts)
- `apps/web/app/page.tsx` (current Dashboard + Basket UI and behavior)
- `apps/web/app/globals.css` (global visual system for current pages)
- `apps/web/app/api/**` (existing health and telegram endpoints/contracts)
- `apps/backend/**` (backend and API contracts)

### Missing / Incomplete parts
- Missing Next.js routes:
  - `/product/[id]`
  - `/favorites`
  - `/profile`
  - `/settings`
  - `/search`
  - `/categories`
  - `/checkout`
  - `/orders`
  - `/notifications`
- Missing client API layer (`/src/lib/api.ts`)
- Missing service layer (`/src/services/*`)
- Missing isolated Telegram SDK wrapper (`/src/lib/telegram.ts`)

### Compatibility findings
- Basket page storage keys: none found in current `apps/web/app/page.tsx` (no `localStorage` usage).
- Existing product shape in Dashboard:
  - `Product`: `{ id, name, price, image }`
  - `Category`: `{ id, name, image }`
- Existing API base URL/fetch usage:
  - No existing frontend fetch client in `apps/web`.
  - Existing local API routes: `/api/health`, `/api/telegram/info`, `/api/telegram/webhook`.

## Ordered Checklist
- [x] Add additive shared marketplace types (`src/types/marketplace.ts`).
- [x] Add isolated API client (`src/lib/api.ts`) with safe fallback behavior.
- [x] Add isolated Telegram wrapper (`src/lib/telegram.ts`) with browser guards.
- [x] Add services (`src/services/*`) for products, cart, favorites, profile, orders, notifications.
- [x] Add isolated UI scaffolding for new pages only (`src/components/new-pages/*`).
- [x] Add `/product/[id]` and verify build.
- [x] Add `/favorites` and verify build.
- [x] Add `/profile` and verify build.
- [x] Add `/settings` and verify build.
- [x] Add `/search` and verify build.
- [x] Add `/categories` and verify build.
- [x] Add `/checkout` and verify build.
- [x] Add `/orders` and verify build.
- [x] Add `/notifications` and verify build.
- [x] Run final checks: `npm run lint`, `npm run build`, `npm run dev` + smoke route checks.

### Validation Notes
- `npm run lint`: passed (no errors)
- `npm run build`: passed
- `npm run dev` smoke checks: all required routes returned HTTP 200 (`/`, `/product/grey-casual-shoe`, `/favorites`, `/profile`, `/settings`, `/search`, `/categories`, `/checkout`, `/orders`, `/notifications`).
- CLI smoke check limitation: click-level client interaction (`Add to Basket` button press in browser UI) was not executable in this terminal-only environment; route-level and compile-level checks passed.

## Guardrails During Implementation
- Only additive changes for new pages/services.
- Keep existing Dashboard/Basket untouched.
- Keep backend untouched.
- Keep Telegram integration isolated and client-safe.
- If any build failure appears, rollback last micro-change and apply a smaller patch.
