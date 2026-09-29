import { DomainEvent } from "../../../shared/events";

export class SubscriberUpdatedEvent extends DomainEvent {
  public constructor(
    public readonly subscriberId: string,
    public readonly tenantId: string,
  ) {
    super();
  }
}
