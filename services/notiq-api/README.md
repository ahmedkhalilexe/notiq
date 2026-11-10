# notiq-api

`notiq-api` is the synchronous HTTP REST API service for **Notiq**.

It provides tenant management, API key lifecycle management, subscriber management, template CRUD, and notification dispatch endpoints. Built using **Bun**, **Express.js**, **PostgreSQL**, and **RabbitMQ** adhering to Clean Architecture & Domain-Driven Design (DDD) principles.

---

## 🔑 Authentication

Two mechanisms, for two kinds of caller:

- **JWT (management routes)** - tenants, API keys, subscribers and templates.
  - `POST /v1/api/tenants` - sign up (public).
  - `POST /v1/api/auth/login` - `{ "email", "password" }` returns `{ access_token, token_type: "Bearer", expires_in, tenant }`.
  - Send `Authorization: Bearer <access_token>` on every other management route.
  - Requires `JWT_SECRET` (at least 32 characters; the API refuses to start without it) and optional `JWT_EXPIRES_IN` (default `1h`).
- **API key (`x-api-key`)** - reserved for the notification-trigger routes; the `apiValidator` middleware is not mounted on management routes.

### API key lifecycle

Create ➔ List ➔ Revoke ➔ Verify. All routes act on the token's tenant:

- `POST /v1/api/api-keys` - generate a named key (`{ "name": "Production" }`). The plaintext key (`ntk_<32 hex characters>`) is returned **only once**.
- `GET /v1/api/api-keys` - list keys (`id`, `name`, `status`, `created_at`, `revoked_at`). Plaintext keys and hashes are never exposed.
- `DELETE /v1/api/api-keys/:keyId` - revoke a key. Revoked keys are kept with a `revoked_at` timestamp; revoking twice returns `409`.

Keys are stored as **SHA-256 hashes**.

## ⚠️ Error responses

Every error, including unknown routes and malformed bodies, is JSON:

```json
{ "status": "error", "code": "VALIDATION_ERROR", "message": "..." }
```

| Status | When                                                                                         |
| :----- | :------------------------------------------------------------------------------------------- |
| `400`  | Validation failure, or a body that is not valid JSON (`INVALID_JSON`)                        |
| `401`  | Missing/invalid token or credentials                                                         |
| `404`  | Resource not found (also for other tenants' resources), or unknown route (`ROUTE_NOT_FOUND`) |
| `409`  | Duplicate resource, including concurrent creates caught by a unique index                    |
| `413`  | Body over the 100 KB limit                                                                   |
| `500`  | Unexpected error (details are logged, never returned)                                        |

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
