# ru-logistics-transit

Logistics transit management platform.

## Stack

| Component    | Technology                           |
|-------------|--------------------------------------|
| Frontend    | Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS + SCSS |
| API         | Fastify 5 + TypeScript + Bun + Prisma 7 |
| Database    | PostgreSQL 17                        |
| Cache       | Redis (alpine)                       |
| Proxy       | nginx 1.25                           |
| Runtime     | Node.js 24 (frontend) / Bun (api)    |

## Architecture

```
nginx :8089
 ├── /api/*   → api:3001
 └── /*       → frontend:3000
```

## Quick Start

```bash
# Start all services (dev mode with hot-reload)
make dev

# Stop all services
make dev-down

# View logs
make logs-dev
```

Open http://localhost:8089

## Services

| Service   | Internal Port | Description                    |
|-----------|--------------|--------------------------------|
| nginx     | 8080         | Reverse proxy                  |
| frontend  | 3000         | Nuxt SSR application           |
| api       | 3001         | Fastify REST API               |
| postgres  | 5432         | Primary database               |
| redis     | 6379         | Cache / sessions / rate limits |

## Environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

## Project Structure

```
├── api/               # Fastify API server
│   ├── prisma/        # Schema & migrations
│   └── src/           # Source code
├── frontend/          # Nuxt frontend
│   ├── assets/        # SCSS, fonts
│   ├── pages/         # Route pages
│   └── components/    # Vue components
├── nginx/             # Nginx config & templates
├── docs/              # Documentation
├── docker-compose.yml      # Dev compose
├── docker-compose.prod.yml # Prod compose
├── .env.example       # Environment template
└── Makefile           # Convenience commands
```

## Documentation

See `docs/` for subsystem details.
