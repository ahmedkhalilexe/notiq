import { DomainEvent } from "../../../shared/events";

export class TenantDeletedEvent extends DomainEvent {
  public constructor(
    public readonly tenantId: string,
    public readonly deletedAt: Date,
  ) {
    super();
  }
}
