# Setup TODO

## 1. Root Files

- [ ] `.env.example` — env vars template
- [ ] `.gitignore` — combined frontend + api ignores
- [ ] `Makefile` — dev/build/down/migrate shortcuts
- [ ] `docker-compose.yml` — dev compose (postgres + redis + api + frontend + nginx)
- [ ] `docker-compose.prod.yml` — prod compose (production builds, external db)

## 2. Frontend

- [ ] `frontend/Dockerfile` — copy from template (node:24-alpine + pnpm, multi-stage)
- [ ] `frontend/Dockerfile.dev` — copy from template
- [ ] `frontend/.dockerignore` — copy from template
- [ ] `frontend/package.json` — copy from template
- [ ] `frontend/pnpm-lock.yaml` — copy from template
- [ ] `frontend/tsconfig.json` — copy from template
- [ ] `frontend/eslint.config.mjs` — copy from template
- [ ] `frontend/vitest.config.ts` — copy from template
- [ ] `frontend/.npmrc` — copy from template
- [ ] `frontend/.nuxtrc` — copy from template
- [ ] `frontend/nuxt.config.ts` — adapt (rename app → ru-logistics-transit, strip mia360 branding)
- [ ] `frontend/app.vue` — minimal Nuxt entry point
- [ ] `frontend/error.vue` — minimal error page
- [ ] `frontend/assets/scss/_variables.scss` — design tokens (copy)
- [ ] `frontend/assets/scss/_fonts.scss` — font-face declarations (copy)

## 3. API

- [ ] `api/Dockerfile` — copy from template (node:24 + bun)
- [ ] `api/Dockerfile.dev` — copy from template
- [ ] `api/.dockerignore` — copy from template
- [ ] `api/package.json` — copy from template
- [ ] `api/bun.lock` — copy from template
- [ ] `api/tsconfig.json` — copy from template
- [ ] `api/eslint.config.mjs` — copy from template
- [ ] `api/vitest.config.ts` — copy from template
- [ ] `api/prisma.config.ts` — copy from template
- [ ] `api/prisma/schema.prisma` — minimal starter schema (User model + enums)
- [ ] `api/prisma/migrations/` — initial migration
- [ ] `api/src/index.ts` — adapt (strip swagger/docs, strip route registrations, keep health + metrics)
- [ ] `api/src/db.ts` — copy Prisma client setup
- [ ] `api/src/cache.ts` — copy Redis cache layer
- [ ] `api/src/metrics.ts` — copy Prometheus metrics
- [ ] `api/src/helpers/logger.helper.ts` — copy Pino logger
- [ ] `api/src/helpers/errors.helper.ts` — copy error helpers
- [ ] `api/src/helpers/validation.helper.ts` — copy validation helpers
- [ ] `api/src/helpers/utils.helper.ts` — copy utilities
- [ ] `api/src/middleware/require-auth.ts` — copy auth middleware
- [ ] `api/src/middleware/require-admin.ts` — copy admin guard
- [ ] `api/src/routes/health.routes.ts` — copy health route

## 4. Nginx

- [ ] `nginx/Dockerfile` — copy from template
- [ ] `nginx/Dockerfile.dev` — copy from template
- [ ] `nginx/docker-entrypoint.sh` — copy from template
- [ ] `nginx/nginx.dev.conf.template` — adapt (remove /ai-socket/, no admin auth)
- [ ] `nginx/nginx.prod.conf.template` — adapt (same)

## 5. Verify

- [ ] `docker compose build` — all services build without errors
- [ ] `make dev` — all services start, health checks pass
- [ ] Frontend accessible at http://localhost:8089
- [ ] API health check responds at http://localhost:8089/api/health

