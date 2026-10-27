import type { DomainEvent } from "../../../shared/events";
import { ApiKeyNameInvalidError } from "../errors/api-key-name-invalid.error";
import { ApiKeyRevokedError } from "../errors/api-key-revoked.error";
import { ApiKeyCreatedEvent } from "../events/api-key-created.event";
import { ApiKeyRevokedEvent } from "../events/api-key-revoked.event";

export interface CreateApiKeyParams {
  tenantId: string;
  keyHash: string;
  name: string;
}

export class ApiKeyEntity {
  private _events: DomainEvent[] = [];

  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly keyHash: string,
    readonly name: string,
    readonly createdAt: Date,
    private _revokedAt: Date | null,
  ) {}

  static create(params: CreateApiKeyParams): ApiKeyEntity {
    const trimmedName = params.name.trim();

    if (trimmedName.length < 1 || trimmedName.length > 255) {
      throw new ApiKeyNameInvalidError();
    }

    const id = crypto.randomUUID();
    const apiKey = new ApiKeyEntity(
      id,
      params.tenantId,
      params.keyHash,
      trimmedName,
      new Date(),
      null,
    );

    apiKey._events.push(new ApiKeyCreatedEvent(apiKey.id, apiKey.tenantId));

    return apiKey;
  }

  public revoke(): void {
    if (this._revokedAt !== null) {
      throw new ApiKeyRevokedError("Api key is already revoked");
    }

    this._revokedAt = new Date();
    this._events.push(
      new ApiKeyRevokedEvent(this.id, this.tenantId, this._revokedAt),
    );
  }

  static reconstitute(
    id: string,
    tenantId: string,
    keyHash: string,
    name: string,
    createdAt: Date,
    revokedAt: Date | null,
  ): ApiKeyEntity {
    return new ApiKeyEntity(
      id,
      tenantId,
      keyHash,
      name,
      createdAt,
      revokedAt,
    );
  }

  get isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get events(): DomainEvent[] {
    return [...this._events];
  }

  public clearEvents(): void {
    this._events = [];
  }
}
