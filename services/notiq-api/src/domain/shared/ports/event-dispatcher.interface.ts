import type { DomainEvent } from "../events";

export interface IEventDispatcher {
  dispatch(events: DomainEvent[]): Promise<void>;
}
