export interface IMessageBroker {
  publish(routingKey: string, payload: Record<string, unknown>): Promise<void>;
}
