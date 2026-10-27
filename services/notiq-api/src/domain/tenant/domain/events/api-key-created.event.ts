import { DomainEvent } from "../../../shared/events";

export class ApiKeyCreatedEvent extends DomainEvent {
  public constructor(
    public readonly apiKeyId: string,
    public readonly tenantId: string,
  ) {
    super();
  }
}
