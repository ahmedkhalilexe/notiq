import { DomainEvent } from "../../../shared/events";

export class SubscriberDeletedEvent extends DomainEvent {
  public constructor(
    public readonly subscriberId: string,
    public readonly tenantId: string,
    public readonly deletedAt: Date,
  ) {
    super();
  }
}
