import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import type { IApiKeyRepository } from "../../domain/repositories/api-key-repository.interface";
import type { ApiKeyEntity } from "../../domain/entities/api-key.entity";
import type { ListApiKeysDTO } from "../dtos/list-api-keys.dto";

export class ListApiKeysUseCase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly apiKeyRepository: IApiKeyRepository,
  ) {}

  public async execute(dto: ListApiKeysDTO): Promise<ApiKeyEntity[]> {
    const tenant = await this.tenantRepository.findById(dto.tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    return this.apiKeyRepository.listByTenantId(dto.tenantId);
  }
}
