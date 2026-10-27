import type { IEventDispatcher } from "../../../shared/ports";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import type { IApiKeyRepository } from "../../domain/repositories/api-key-repository.interface";
import { ApiKey } from "../../domain/value-objects/api-key.vo";
import { ApiKeyEntity } from "../../domain/entities/api-key.entity";
import type { CreateApiKeyDTO } from "../dtos/create-api-key.dto";

export interface CreateApiKeyResult {
  apiKey: ApiKeyEntity;
  rawKey: string;
}

export class CreateApiKeyUseCase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: CreateApiKeyDTO): Promise<CreateApiKeyResult> {
    const tenant = await this.tenantRepository.findById(dto.tenantId);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    const rawApiKey = ApiKey.generate();
    const apiKeyEntity = ApiKeyEntity.create({
      tenantId: tenant.id,
      keyHash: rawApiKey.hash(),
      name: dto.name,
    });

    await this.apiKeyRepository.save(apiKeyEntity);
    await this.eventDispatcher.dispatch(apiKeyEntity.events);
    apiKeyEntity.clearEvents();

    return {
      apiKey: apiKeyEntity,
      rawKey: rawApiKey.value,
    };
  }
}
