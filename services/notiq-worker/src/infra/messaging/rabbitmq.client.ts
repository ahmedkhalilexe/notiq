import amqplib from "amqplib";
import type { ChannelModel, Channel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  connection = await amqplib.connect(process.env.RABBITMQ_URL!);
  channel = await connection.createChannel();

  await channel.assertExchange("notiq.notifications", "direct", {
    durable: true,
  });

  await channel.assertQueue("email.queue", { durable: true });
  await channel.assertQueue("sms.queue", { durable: true });
  await channel.assertQueue("in_app.queue", { durable: true });

  await channel.bindQueue("email.queue", "notiq.notifications", "email");
  await channel.bindQueue("sms.queue", "notiq.notifications", "sms");
  await channel.bindQueue("in_app.queue", "notiq.notifications", "in_app");
}

export function getChannel(): Channel {
  if (!channel)
    throw new Error("RabbitMQ not connected, call connectRabbitMQ first");
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}
