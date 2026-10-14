import { DomainEvent } from "../../../shared/events";

export class SubscriberCreatedEvent extends DomainEvent {
  public constructor(
    public readonly subscriberId: string,
    public readonly tenantId: string,
  ) {
    super();
  }
}
