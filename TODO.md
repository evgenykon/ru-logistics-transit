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

- [ ] `docker compose build` — all services build without errors
- [ ] `make dev` — all services start, health checks pass
- [ ] Frontend accessible at http://localhost:8089
- [ ] API health check responds at http://localhost:8089/api/health

