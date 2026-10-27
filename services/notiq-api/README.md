# notiq-api

`notiq-api` is the synchronous HTTP REST API service for **Notiq**.

It provides tenant management, API key lifecycle management, subscriber management, template CRUD, and notification dispatch endpoints. Built using **Bun**, **Express.js**, **PostgreSQL**, and **RabbitMQ** adhering to Clean Architecture & Domain-Driven Design (DDD) principles.

---

## 🔑 API Key Lifecycle & Authentication

API keys are decoupled from tenant creation and follow an independent lifecycle: **Create ➔ List ➔ Revoke ➔ Verify (Use)**.

- **Security & Storage**:
  - Keys use the format `ntk_<32 hex characters>`.
  - Keys are stored securely in PostgreSQL as **SHA-256 hashes**.
  - The raw plaintext key is returned **only once** upon creation.
- **Endpoints**:
  - `POST /v1/api/tenants/:id/api-keys` - Generate a new named key (e.g. `{ "name": "Production" }`).
  - `GET /v1/api/tenants/:id/api-keys` - List all keys for a tenant (`id`, `name`, `status`, `created_at`, `revoked_at`). Plaintext keys and hashes are never exposed.
  - `DELETE /v1/api/tenants/:id/api-keys/:keyId` - Revoke a key. Revoked keys are retained with a `revoked_at` timestamp for audit history.
- **Authentication Middleware (`apiValidator`)**:
  - Protects routes by requiring `x-api-key: ntk_...` (or `X-API-KEY`).
  - Hashes the incoming key, validates it against non-revoked records, checks that the tenant is active, and injects `req.tenant` and `req.tenantId` onto the Express request object.

---

## 🛠 Development

Install dependencies:
```bash
bun install
```

Run in development mode (hot reload):
```bash
bun dev
```

Run tests:
```bash
bun test
```

Run database migrations:
```bash
bun run knex migrate:latest --knexfile knexfile.ts
```

For complete architecture overview, system design, and API reference, see the main [Root README](../../README.md).
