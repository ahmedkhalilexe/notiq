import type { DbConnection } from "../../../../infra/database/connection";
import type { Tenant } from "../../domain/entities/tenant.entity";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import { TenantMapper } from "../mappers/tenant.mapper";

export class TenantRepository implements ITenantRepository {
  public constructor(private readonly db: DbConnection) {}

  async save(tenant: Tenant): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("tenants").insert(TenantMapper.toPersistence(tenant));
    });
  }

  async update(tenant: Tenant): Promise<void> {
    await this.db("tenants")
      .where("id", tenant.id)
      .update(TenantMapper.toPersistence(tenant));
  }

  async findById(id: string): Promise<Tenant | null> {
    const raw = await this.db("tenants")
      .where("tenants.id", id)
      .whereNull("tenants.deleted_at")
      .select(
        "tenants.id",
        "tenants.name",
        "tenants.email",
        "tenants.password",
        "tenants.created_at",
        "tenants.deleted_at",
      )
      .first();

    if (!raw) return null;
    return TenantMapper.toDomain(raw);
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    const raw = await this.db("tenants")
      .where("tenants.email", email.toLowerCase().trim())
      .whereNull("tenants.deleted_at")
      .select(
        "tenants.id",
        "tenants.name",
        "tenants.email",
        "tenants.password",
        "tenants.created_at",
        "tenants.deleted_at",
      )
      .first();

    if (!raw) return null;
    return TenantMapper.toDomain(raw);
  }
}
