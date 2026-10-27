import type { ApiKeyEntity } from "../entities/api-key.entity";

export interface IApiKeyRepository {
  save(apiKey: ApiKeyEntity): Promise<void>;
  update(apiKey: ApiKeyEntity): Promise<void>;
  findById(id: string): Promise<ApiKeyEntity | null>;
  findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null>;
  listByTenantId(tenantId: string): Promise<ApiKeyEntity[]>;
}
