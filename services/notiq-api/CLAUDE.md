# notiq-api

Follow the root [`CLAUDE.md`](../../CLAUDE.md); this file only adds service-specific notes.

## Runtime

- Bun is the runtime and package manager: `bun install`, `bun dev`, `bun test`, `bun run typecheck`, `bun run ci` (Biome).
- Bun loads `.env` automatically; do not add `dotenv`.

## Stack (do not swap for Bun built-ins)

- HTTP: **Express 5** (`src/infra/http`), not `Bun.serve()`.
- Database: **PostgreSQL via Knex + `pg`** (`src/infra/database`), not `Bun.sql`.
- Broker: **RabbitMQ via `amqplib`** (`src/infra/messaging`).
- Validation: **Joi** schemas next to each controller, run through `validate()`.

## Conventions

- Each domain lives in `src/domain/<name>/{domain,application,infrastructure}`.
- Throw an `AppError` subclass (`ValidationError`, `ConflictError`, `NotFoundError`, `UnauthorizedError`) for anything the client caused; a plain `Error` becomes a 500.
- Controllers take the tenant from `getTenantId(req)` only, never from params, query or body.
- Schema changes are new Knex migrations in `src/infra/database/migrations`; this service owns all migrations.
- Tests are `*.test.ts` next to the code they cover.
