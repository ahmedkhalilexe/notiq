import { ConflictError } from "../../../shared/errors/conflict-error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IEventDispatcher } from "../../../shared/ports";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";

export class DeleteTenantUsecase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(id: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(id);

    if (!tenant) {
      throw new NotFoundError("Tenant not found.");
    }

    if (tenant.deletedAt != null) {
      throw new ConflictError("Tenant already deleted.");
    }

    tenant.delete();
    await this.tenantRepository.update(tenant);

    this.eventDispatcher.dispatch(tenant.events);
    tenant.clearEvents();
  }
}
