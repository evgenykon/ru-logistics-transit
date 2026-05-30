# Architecture

## Overview

TODO: Describe the overall system architecture, services, and communication flows.

## Services

- **nginx** — reverse proxy (port 8089)
- **frontend** — Nuxt 4 + Vue 3 SSR (port 3000)
- **api** — Fastify + Prisma REST API (port 3001)
- **postgres** — primary database
- **redis** — caching / rate limiting / sessions

## Diagram

```
┌─────────┐
│  nginx  │ :8089
└────┬────┘
     │
     ├── /api/* ──────► api:3001
     │
     └── /* ──────────► frontend:3000
```

## Data Flow

TODO: Document request lifecycle, auth flow, background jobs.
