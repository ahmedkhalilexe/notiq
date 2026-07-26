# notiq-worker

`notiq-worker` is the asynchronous queue consumer service for **Notiq**.

It listens to RabbitMQ channel queues (`email_queue`, `in_app_queue`, `sms_queue`) and executes notification delivery via third-party provider adapters, recording logs and statuses back to PostgreSQL.

## Development

Install dependencies:
```bash
bun install
```

Run in development mode (hot reload):
```bash
bun dev
```

For complete architecture overview, system design, and queue mechanics, see the main [Root README](../../README.md).
