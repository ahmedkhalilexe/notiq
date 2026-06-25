import type { IMessageBroker } from "./message-broker.interface";
import { getChannel } from "./rabbitmq.client";

export class RabbitMQBroker implements IMessageBroker {
  private exchange = "notiq.notifications";
  public async publish(
    routingKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const channel = getChannel();
    channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }
}
