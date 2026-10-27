import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import type { IApiKeyRepository } from "../../domain/repositories/api-key-repository.interface";
import { ApiKey } from "../../domain/value-objects/api-key.vo";
import { ApiKeyRevokedError } from "../../domain/errors/api-key-revoked.error";
import { TenantApiKeyInvalidError } from "../../domain/errors/tenant-api-key-invalid.error";
import type { Tenant } from "../../domain/entities/tenant.entity";
import type { FindByApiKeyTenantDTO } from "../dtos/find-by-api-key-tenant.dto";

export class GetTenantByApiKeyUseCase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  public async execute(dto: FindByApiKeyTenantDTO): Promise<Tenant> {
    const { apiKey: raw } = dto;
    const apiKey = ApiKey.create(raw);
    const keyHash = apiKey.hash();

    const apiKeyEntity = await this.apiKeyRepository.findByKeyHash(keyHash);
    if (!apiKeyEntity) {
      throw new TenantApiKeyInvalidError();
    }

    if (apiKeyEntity.isRevoked) {
      throw new ApiKeyRevokedError();
    }

    const tenant = await this.tenantRepository.findById(apiKeyEntity.tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found or has been deleted");
    }

    return tenant;
  }
}
