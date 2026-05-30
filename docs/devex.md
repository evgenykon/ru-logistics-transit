# Developer Experience

## Prerequisites

- Docker & Docker Compose
- Node.js 24 (optional — can run entirely in containers)

## Quick Start

```bash
make dev       # build & start all services
make dev-down  # stop all services
make logs-dev  # tail logs
```

## Running Commands Inside Containers

```bash
# Open a shell in the api container
make run-dev-api

# Open a shell in the frontend container
make run-dev-frontend

# Run Prisma migrations
make dev-migrate

# Generate Prisma client
make dev-prisma-generate
```

## Linting & Type Checking

```bash
make tools-up              # start tools container
make tools-install         # install deps in tools container
make tools-lint-api        # lint API code
make tools-lint-frontend   # lint frontend code
make tools-typecheck-api   # type-check API
make tools-typecheck-frontend  # type-check frontend
```

## Testing

```bash
docker compose -f docker-compose.dev.yml exec api npx vitest
docker compose -f docker-compose.dev.yml exec frontend npx vitest
```

## Tips

- The `api` service uses `bun --watch` for auto-restart on file changes
- The `frontend` service uses Nuxt dev mode with HMR
- Postgres data persists in a named volume (`postgres_data`)
- Redis data persists in a named volume (`redis_data`)
