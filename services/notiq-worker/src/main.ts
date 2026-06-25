// services/notiq-worker/src/main.ts
import { db } from "./infra/database/connection";
import {
  connectRabbitMQ,
  closeRabbitMQ,
} from "./infra/messaging/rabbitmq.client";
import { startConsumers } from "./infra/messaging/consumers";

async function bootstrap() {
  await db.migrate.latest();
  console.log("database connected");

  await connectRabbitMQ();
  console.log("rabbitmq connected");

  await startConsumers();
  console.log("notiq-worker running, waiting for messages...");

  async function shutdown(signal: string) {
    console.log(`${signal} received, shutting down gracefully...`);

    const forceExit = setTimeout(() => {
      console.error("forced shutdown after timeout");
      process.exit(1);
    }, 10_000);

    forceExit.unref();

    await closeRabbitMQ();
    await db.destroy();

    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  setTimeout(() => process.exit(1), 10_000);
}

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
