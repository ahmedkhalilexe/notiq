import bcrypt from "bcrypt";
import type { Tenant } from "../../domain/entities/tenant.entity";
import { InvalidCredentialsError } from "../../domain/errors/invalid-credentials.error";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import type { LoginTenantDTO } from "../dtos/login-tenant.dto";

// Compared against when the email is unknown, so both failure paths cost one
// bcrypt round and response time does not reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("notiq-unknown-tenant", 10);

export class LoginTenantUseCase {
  public constructor(private readonly tenantRepository: ITenantRepository) {}

  public async execute(dto: LoginTenantDTO): Promise<Tenant> {
    const tenant = await this.tenantRepository.findByEmail(dto.email);

    const passwordMatches = await bcrypt.compare(
      dto.password,
      tenant?.password.value ?? DUMMY_HASH,
    );

    if (!tenant || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return tenant;
  }
}
