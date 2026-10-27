import type { Knex } from "knex";
import type { IApiKeyRepository } from "../../domain/repositories/api-key-repository.interface";
import type { ApiKeyEntity } from "../../domain/entities/api-key.entity";
import { ApiKeyMapper, type ApiKeyPersistence } from "../mappers/api-key.mapper";

export class ApiKeyRepository implements IApiKeyRepository {
  public constructor(private readonly db: Knex) {}

  async save(apiKey: ApiKeyEntity): Promise<void> {
    await this.db("tenant_api").insert({
      id: apiKey.id,
      tenant_id: apiKey.tenantId,
      key: apiKey.keyHash,
      name: apiKey.name,
      created_at: apiKey.createdAt,
      updated_at: apiKey.createdAt,
      revoked_at: apiKey.revokedAt,
    });
  }

  async update(apiKey: ApiKeyEntity): Promise<void> {
    await this.db("tenant_api")
      .where("id", apiKey.id)
      .update({
        name: apiKey.name,
        revoked_at: apiKey.revokedAt,
        updated_at: new Date(),
      });
  }

  async findById(id: string): Promise<ApiKeyEntity | null> {
    const raw = await this.db<ApiKeyPersistence>("tenant_api")
      .where("id", id)
      .first();

    if (!raw) return null;
    return ApiKeyMapper.toDomain(raw);
  }

  async findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null> {
    const raw = await this.db<ApiKeyPersistence>("tenant_api")
      .where("key", keyHash)
      .first();

    if (!raw) return null;
    return ApiKeyMapper.toDomain(raw);
  }

  async listByTenantId(tenantId: string): Promise<ApiKeyEntity[]> {
    const raw = await this.db<ApiKeyPersistence>("tenant_api")
      .where("tenant_id", tenantId)
      .orderBy("created_at", "desc");

    return raw.map((item) => ApiKeyMapper.toDomain(item));
  }
}
