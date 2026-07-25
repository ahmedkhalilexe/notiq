import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IEventDispatcher } from "../../../shared/ports";
import type { Tenant } from "../../domain/entities/tenant.entity";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import { TenantMapper } from "../../infrastructure/mappers/tenant.mapper";
import type { FindByIdTenantDTO } from "../dtos/find-by-id-tenant.dto";

export class FindByIdTenantUsecase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: FindByIdTenantDTO): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(dto.id);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }
    return tenant;
  }
}
