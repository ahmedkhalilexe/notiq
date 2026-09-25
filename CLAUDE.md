# Notiq Development Guide

## Runtime & Tooling
- **Runtime**: Bun (v1.3+)
- **Package Manager**: Bun (`bun install`, `bun add <pkg>`, `bun run <script>`)
- **Testing**: `bun test`
- **Type Checking**: `bun x tsc --noEmit`

## Architecture & Conventions
- **Clean Architecture & DDD**:
  - `domain`: Entities, Value Objects, Domain Events, Domain Errors, Repository Interfaces.
  - `application`: Use cases and DTOs.
  - `infrastructure`: Database repositories (Knex), HTTP controllers, route definitions, validators, mappers.
- **API Framework**: Express.js with async handlers and Joi validators.
- **Database**: PostgreSQL 16 managed via Knex migrations.
- **Message Broker**: RabbitMQ with topic/direct exchanges and channel-specific queues (`email.queue`, `sms.queue`, `in_app.queue`).
- **Cache**: Redis.

## Testing Guidelines
- Run unit tests with `bun test`.
- Add test suites for all domains mirroring `*.test.ts`.
