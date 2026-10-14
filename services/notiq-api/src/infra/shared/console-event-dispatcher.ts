import type { DomainEvent } from "../../domain/shared/events/domain-event";
import type { IEventDispatcher } from "../../domain/shared/ports";

export class ConsoleEventDispatcher implements IEventDispatcher {
  async dispatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      console.log(
        `[EVENT] ${event.eventType} at ${event.occurredAt.toISOString()}`,
        JSON.stringify(event),
      );
    }
  }
}
