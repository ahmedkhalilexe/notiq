import type { IEventDispatcher } from "../../../shared/ports";
import { Tenant } from "../../domain/entities/tenant.entity";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import { Password } from "../../domain/value-objetcs/password.vo";
import type { CreateTenantDTO } from "../dtos/create-tenant.dto";
import bcrypt from "bcrypt";
export class CreateTenantUseCase {
  public constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}
  public async execute(dto: CreateTenantDTO): Promise<Tenant> {
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
