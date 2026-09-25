import type { IEventDispatcher } from "../../../shared/ports";
import { Tenant } from "../../domain/entities/tenant.entity";
import { TenantEmailExistsError } from "../../domain/errors/tenant-email-exists.error";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import { Password } from "../../domain/value-objects/password.vo";
import type { CreateTenantDTO } from "../dtos/create-tenant.dto";
import bcrypt from "bcrypt";

export class CreateTenantUseCase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: CreateTenantDTO): Promise<Tenant> {
    const existing = await this.tenantRepository.findByEmail(dto.email);
    if (existing) {
      throw new TenantEmailExistsError();
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const passwordVO = Password.create(hashedPassword);

    const tenant: Tenant = Tenant.create({
      name: dto.name,
      email: dto.email,
      password: passwordVO,
    });

    await this.tenantRepository.save(tenant);

    await this.eventDispatcher.dispatch(tenant.events);
    tenant.clearEvents();

    return tenant;
  }
}
