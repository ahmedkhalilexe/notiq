// src/main.ts

import { db } from "./infra/database/connection";
import { app } from "./infra/http/server";
import {
  closeRabbitMQ,
  connectRabbitMQ,
} from "./infra/messaging/rabbitmq.client";

const PORT = process.env.PORT ?? 3000;

async function retry<T>(
  label: string,
  fn: () => Promise<T>,
  { retries = 10, delayMs = 3_000 }: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt === retries;
      console.warn(
        `[retry] ${label} failed (attempt ${attempt}/${retries}):`,
        (err as Error).message
      );
      if (isLast) throw err;
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw new Error(`[retry] ${label} exhausted all retries`);
}

async function bootstrap() {
  await retry("db.migrate", () => db.migrate.latest());
  console.log("database connected and migrations up to date");

  await retry("connectRabbitMQ", () => connectRabbitMQ());
  console.log("rabbitmq connected");

  const server = app.listen(PORT, () => {
    console.log(`notiq-api running on port ${PORT}`);
  });

  async function shutdown(signal: string) {
    console.log(`${signal} received, shutting down gracefully...`);

    server.close(async () => {
      console.log("http server closed");

      await db.destroy();
      console.log("database pool closed");

      await closeRabbitMQ();
      console.log("rabbitmq connection closed");

      process.exit(0);
    });

    setTimeout(() => {
      console.error("forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// safety net
process.on("unhandledRejection", (reason) => {
  console.error("unhandled rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("uncaught exception:", error);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error("failed to start:", err);
  process.exit(1);
});
