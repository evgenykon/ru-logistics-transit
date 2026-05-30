# API Subsystem

**Stack:** Fastify 5 + TypeScript + Bun + Prisma 7

## Entry Point

`api/src/index.ts` — Fastify server on port 3001.

## Structure

```
api/src/
├── index.ts              # server bootstrap
├── db.ts                 # Prisma client
├── cache.ts              # Redis cache layer
├── metrics.ts            # Prometheus metrics
├── helpers/              # logger, validation, errors
├── middleware/           # auth guards
├── routes/               # route definitions
├── controllers/          # request handlers
├── services/             # business logic
├── repositories/         # data access layer
└── schemas/              # validation schemas
```

## Routes

TODO: Document API endpoints.

## Conventions

- All routes use `async (req, reply)` handlers
- Validation via Joi schemas
- Auth via JWT in HttpOnly cookies
- Service-to-service auth via HMAC-signed JWTs (API_KEY)
