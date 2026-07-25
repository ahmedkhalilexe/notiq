import { DomainEvent } from "../../../shared/events";

export class TenantCreatedEvent extends DomainEvent {
  public constructor(public readonly tenantId: string) {
    super();
  }
}
