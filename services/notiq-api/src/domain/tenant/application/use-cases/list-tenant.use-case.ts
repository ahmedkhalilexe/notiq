import type { IEventDispatcher } from "../../../shared/ports";
import type { Tenant } from "../../domain/entities/tenant.entity";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import type { ListTenantDTO } from "../dtos/list-tenant.dto";

export class ListTenantUsecase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: ListTenantDTO): Promise<Tenant[]> {
    const tenants = await this.tenantRepository.list(dto.page, dto.limit);

    return tenants;
  }
}
