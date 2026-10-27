import { DomainEvent } from "../../../shared/events";

export class ApiKeyRevokedEvent extends DomainEvent {
  public constructor(
    public readonly apiKeyId: string,
    public readonly tenantId: string,
    public readonly revokedAt: Date,
  ) {
    super();
  }
}
