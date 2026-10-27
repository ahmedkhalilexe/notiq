import { ApiKeyEntity } from "../../domain/entities/api-key.entity";

export interface ApiKeyPersistence {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  created_at: Date;
  updated_at?: Date;
  revoked_at: Date | null;
}

export interface ApiKeyResponseDTO {
  id: string;
  tenant_id: string;
  name: string;
  status: "active" | "revoked";
  created_at: Date;
  revoked_at: Date | null;
}

export interface ApiKeyCreatedResponseDTO {
  api_key: string;
  key_details: ApiKeyResponseDTO;
}

export class ApiKeyMapper {
  static toDomain(raw: ApiKeyPersistence): ApiKeyEntity {
    return ApiKeyEntity.reconstitute(
      raw.id,
      raw.tenant_id,
      raw.key,
      raw.name,
      new Date(raw.created_at),
      raw.revoked_at ? new Date(raw.revoked_at) : null,
    );
  }

  static toPersistence(entity: ApiKeyEntity): ApiKeyPersistence {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      key: entity.keyHash,
      name: entity.name,
      created_at: entity.createdAt,
      revoked_at: entity.revokedAt,
    };
  }

  static toResponse(entity: ApiKeyEntity): ApiKeyResponseDTO {
    return {
      id: entity.id,
      tenant_id: entity.tenantId,
      name: entity.name,
      status: entity.isRevoked ? "revoked" : "active",
      created_at: entity.createdAt,
      revoked_at: entity.revokedAt,
    };
  }
}
