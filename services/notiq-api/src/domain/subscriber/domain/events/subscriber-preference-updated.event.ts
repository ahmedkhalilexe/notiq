import { DomainEvent } from "../../../shared/events";

export class SubscriberPreferenceUpdatedEvent extends DomainEvent {
  public constructor(
    public readonly subscriberId: string,
    public readonly tenantId: string,
    public readonly channel: string,
    public readonly enabled: boolean,
  ) {
    super();
  }
}
