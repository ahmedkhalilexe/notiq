# notiq-worker

Follow the root [`CLAUDE.md`](../../CLAUDE.md); this file only adds service-specific notes.

## Runtime

- Bun is the runtime and package manager: `bun install`, `bun dev`, `bun test`, `bun run typecheck`, `bun run ci` (Biome).
- Bun loads `.env` automatically; do not add `dotenv`.

## Stack (do not swap for Bun built-ins)

- Database: **PostgreSQL via Knex + `pg`** (`src/infra/database`), not `Bun.sql`.
- Broker: **RabbitMQ via `amqplib`** (`src/infra/messaging`); queues are `email.queue`, `sms.queue`, `in_app.queue`.

## Conventions

- Consumers are registered in `src/infra/messaging/consumers`.
- Migrations live in `notiq-api`, not here.
- Tests are `*.test.ts` next to the code they cover.
