# Deployment

## Docker Compose

### Development

```bash
make dev
```

Starts all services with hot-reload:
- postgres on port 5432
- redis on port 6379
- api with bun --watch
- frontend with nuxt dev (HMR)
- nginx on port 8089

### Production

```bash
make build
make up
```

Uses production Dockerfiles (multi-stage, no source code, no dev deps).

## Environment Variables

See `.env.example` for all required variables.

## Health Checks

- api: `GET /health` (port 3001)
- nginx: `GET /nginx-status` (port 8089, internal)

## Resource Limits

| Service | CPU | Memory |
|---------|-----|--------|
| nginx   | 0.2 | 128M   |
| api     | 1   | 512M   |
| frontend| 1   | 1GB    |
| postgres| 0.5 | 256M   |
| redis   | 0.5 | 256M   |
