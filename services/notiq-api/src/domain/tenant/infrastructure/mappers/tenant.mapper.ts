import { Tenant } from "../../domain/entities/tenant.entity";
import { Password } from "../../domain/value-objects/password.vo";

export interface TenantPersistence {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  deleted_at: Date | null;
}

export interface TenantResponseDTO {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  deleted_at: Date | null;
}

export class TenantMapper {
  static toDomain(raw: TenantPersistence): Tenant {
    const password = Password.create(raw.password);
    return Tenant.reconstitute(
      raw.id,
      raw.name,
      raw.email,
      password,
      new Date(raw.created_at),
      raw.deleted_at ? new Date(raw.deleted_at) : null,
    );
  }

  static toPersistence(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      password: tenant.password.value,
      created_at: tenant.createdAt,
      deleted_at: tenant.deletedAt,
    };
  }

  static toResponse(tenant: Tenant): TenantResponseDTO {
    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      created_at: tenant.createdAt,
      deleted_at: tenant.deletedAt,
    };
  }
}
