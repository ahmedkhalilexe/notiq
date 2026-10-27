import type { IEventDispatcher } from "../../../shared/ports";
import type { IApiKeyRepository } from "../../domain/repositories/api-key-repository.interface";
import { ApiKeyNotFoundError } from "../../domain/errors/api-key-not-found.error";
import type { ApiKeyEntity } from "../../domain/entities/api-key.entity";
import type { RevokeApiKeyDTO } from "../dtos/revoke-api-key.dto";

export class RevokeApiKeyUseCase {
  public constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: RevokeApiKeyDTO): Promise<ApiKeyEntity> {
    const apiKey = await this.apiKeyRepository.findById(dto.keyId);
    if (!apiKey || apiKey.tenantId !== dto.tenantId) {
      throw new ApiKeyNotFoundError();
    }

    apiKey.revoke();

    await this.apiKeyRepository.update(apiKey);
    await this.eventDispatcher.dispatch(apiKey.events);
    apiKey.clearEvents();

    return apiKey;
  }
}
