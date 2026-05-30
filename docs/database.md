# Database Subsystem

**Stack:** PostgreSQL + Prisma 7 ORM

## Connection

`DATABASE_URL=postgresql://postgres:postgres@db:5432/ru_logistics_transit`

## Schema

Defined in `api/prisma/schema.prisma`.

### Models

TODO: Document all models, relations, and enums.

### Migrations

```bash
# Create migration
make dev-migrate-create name=<migration_name>

# Apply migrations
make dev-migrate

# Generate Prisma client
make dev-prisma-generate
```

## Conventions

- Use `@prisma/adapter-pg` for connection pooling
- All queries logged via Prisma event hooks
- Slow queries (>5s) emit warnings via Pino logger
