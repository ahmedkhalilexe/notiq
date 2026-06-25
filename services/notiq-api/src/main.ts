// src/main.ts

import { db } from "./infra/database/connection";
import { app } from "./infra/http/server";
import {
  closeRabbitMQ,
  connectRabbitMQ,
} from "./infra/messaging/rabbitmq.client";

const PORT = process.env.PORT ?? 3000;

async function bootstrap() {
  await db.migrate.latest();
  console.log("database connected and migrations up to date");

  await connectRabbitMQ();
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
