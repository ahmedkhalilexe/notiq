# notiq-api

`notiq-api` is the synchronous HTTP REST API service for **Notiq**.

It provides tenant management, authentication, subscriber management, template CRUD, and notification dispatch endpoints. Built using **Bun**, **Express.js**, **PostgreSQL**, and **RabbitMQ** adhering to Clean Architecture & Domain-Driven Design (DDD) principles.

## Development

Install dependencies:
```bash
bun install
```

Run in development mode (hot reload):
```bash
bun dev
```

Run database migrations:
```bash
bun run knex migrate:latest --knexfile knexfile.ts
```

For complete architecture overview, system design, and API reference, see the main [Root README](../../README.md).
