# Setup TODO

## 1. Root Files

- [x] `.env.example` — env vars template
- [x] `.gitignore` — combined frontend + api ignores
- [x] `Makefile` — dev/build/down/migrate shortcuts
- [x] `docker-compose.yml` — dev compose (postgres + redis + api + frontend + nginx)
- [x] `docker-compose.prod.yml` — prod compose (production builds, external db)

## 2. Frontend

- [x] `frontend/Dockerfile` — copy from template (node:24-alpine + pnpm, multi-stage)
- [x] `frontend/Dockerfile.dev` — copy from template
- [x] `frontend/.dockerignore` — copy from template
- [x] `frontend/package.json` — copy from template
- [x] `frontend/pnpm-lock.yaml` — copy from template
- [x] `frontend/tsconfig.json` — copy from template
- [x] `frontend/eslint.config.mjs` — copy from template
- [x] `frontend/vitest.config.ts` — copy from template
- [x] `frontend/.npmrc` — copy from template
- [x] `frontend/.nuxtrc` — copy from template
- [x] `frontend/nuxt.config.ts` — adapt (rename app → ru-logistics-transit, strip mia360 branding)
- [x] `frontend/app.vue` — minimal Nuxt entry point
- [x] `frontend/error.vue` — minimal error page
- [x] `frontend/assets/scss/_variables.scss` — design tokens (copy)
- [x] `frontend/assets/scss/_fonts.scss` — font-face declarations (copy)

## 3. API

- [x] `api/Dockerfile` — copy from template (node:24 + bun)
- [x] `api/Dockerfile.dev` — copy from template
- [x] `api/.dockerignore` — copy from template
- [x] `api/package.json` — copy from template
- [x] `api/bun.lock` — copy from template
- [x] `api/tsconfig.json` — copy from template
- [x] `api/eslint.config.mjs` — copy from template
- [x] `api/vitest.config.ts` — copy from template
- [x] `api/prisma.config.ts` — copy from template
- [x] `api/prisma/schema.prisma` — minimal starter schema (User model + enums)
- [x] `api/prisma/migrations/` — initial migration
- [x] `api/src/index.ts` — adapt (strip swagger/docs, strip route registrations, keep health + metrics)
- [x] `api/src/db.ts` — copy Prisma client setup
- [x] `api/src/cache.ts` — copy Redis cache layer
- [x] `api/src/metrics.ts` — copy Prometheus metrics
- [x] `api/src/helpers/logger.helper.ts` — copy Pino logger
- [x] `api/src/helpers/errors.helper.ts` — copy error helpers
- [x] `api/src/helpers/validation.helper.ts` — copy validation helpers
- [x] `api/src/helpers/utils.helper.ts` — copy utilities
- [x] `api/src/middleware/require-auth.ts` — copy auth middleware
- [x] `api/src/middleware/require-admin.ts` — copy admin guard
- [x] `api/src/routes/health.routes.ts` — copy health route

## 4. Nginx

- [x] `nginx/Dockerfile` — copy from template
- [x] `nginx/Dockerfile.dev` — copy from template
- [x] `nginx/docker-entrypoint.sh` — copy from template
- [x] `nginx/nginx.dev.conf.template` — adapt (remove /ai-socket/, no admin auth)
- [x] `nginx/nginx.prod.conf.template` — adapt (same)

## 5. Verify

- [x] `docker compose build` — all services build without errors
- [x] `make dev` — all services start, health checks pass
- [x] Frontend accessible at http://localhost:8089
- [x] API health check responds at http://localhost:8089/api/health

---

# CRM Logistics — Feature Plan

## 6. Auth & Layout

- [x] API: login/logout routes (session-based, HttpOnly cookie)
- [x] API: `GET /api/auth/me` — current user + roles + permissions
- [x] Frontend: Login page (email + password, no registration)
- [x] Frontend: App layout — dark left sidebar + light center
- [x] Frontend: Sidebar navigation (reads installed modules from API)
- [x] Frontend: useAuth composable (Pinia store)
- [x] Frontend: useModules composable (Pinia store)

## 7. Modules System

- [x] Prisma: Module model (key, name, icon, route, enabled, order, config JSON)
- [x] API: module CRUD routes (admin-only)
- [x] API: `GET /api/modules` — list enabled modules for current user
- [x] Frontend: Module installer page (admin)
- [x] Frontend: Dynamic sidebar rendering from module registry

## 8. Base Pages

- [x] Dashboard page — placeholder with stats cards
- [x] Settings page — profile info, password change
- [x] 404 page

## 9. Core Libraries

- [x] Install: chart.js (vue-chartjs), maplibre-gl, markdown-it, jspdf, jszip (added to package.json)
- [x] Roboto Flex — локальные woff2 файлы (cyrillic-ext, cyrillic, latin)
- [x] Google Fonts CDN удалён — только локальные шрифты
- [x] Chart component wrapper (Chart.vue — bar/line/doughnut/pie)
- [x] Map component wrapper (Map.vue — MapLibre GL)
- [x] Markdown renderer component (Markdown.vue — markdown-it)
- [x] PDF generator utility (usePdf.ts — jsPDF)
- [x] ZIP download utility (useZip.ts — JSZip)

## 10. Future Modules (scaffold-ready)

- [ ] Заказы/грузы
- [ ] Транспорт/ТС
- [ ] Склад/Warehouse
- [ ] Контрагенты
- [ ] Трекинг/GPS
- [ ] Финансы

