import { Tenant } from "../../domain/entities/tenant.entity";
import { ApiKey } from "../../domain/value-objetcs/api-key.vo";
import { Password } from "../../domain/value-objetcs/password.vo";

interface TenantPersistence {
  id: string;
  name: string;
  email: string;
  password: string;
  api_key: string;
  created_at: Date;
}

export class TenantMapper {
  static toDomain(raw: TenantPersistence): Tenant {
    const password = Password.create(raw.password);
    const apiKey = ApiKey.create(raw.api_key);
    return Tenant.reconstitute(
      raw.id,
      raw.name,
      raw.email,
      password,
      apiKey,
      new Date(raw.created_at),
    );
  }

  static toPersistence(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      password: tenant.password.value,
      created_at: tenant.createdAt,
    };
  }
}
