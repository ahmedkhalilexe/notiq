import type { DbConnection } from "../../../../infra/database/connection";
import type { Tenant } from "../../domain/entities/tenant.entity";
import type { ITenantRepository } from "../../domain/repositories/tenant-repository.interface";
import { TenantMapper } from "../mappers/tenant.mapper";

export class TenantRepository implements ITenantRepository {
  public constructor(private readonly db: DbConnection) {}
  async save(tenant: Tenant): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("tenants").insert(TenantMapper.toPersistence(tenant));

      await trx("tenant_api").insert({
        key: tenant.apiKey.value,
        tenant_id: tenant.id,
        created_at: tenant.createdAt,
        updated_at: tenant.createdAt,
      });
    });
  }
  async findById(id: string): Promise<Tenant | null> {
    const raw = await this.db("tenants")
      .join("tenant_api", "tenants.id", "tenant_api.tenant_id")
      .where("tenants.id", id)
      .select(
        "tenants.id",
        "tenants.name",
        "tenants.email",
        "tenants.password",
        "tenants.created_at",
        "tenant_api.key as api_key",
      )
      .first();
    if (!raw) return null;
    return TenantMapper.toDomain(raw);
  }
  async list(page: number, limit: number): Promise<Tenant[]> {
    const raw = await this.db("tenants")
      .join("tenant_api", "tenants.id", "tenant_api.tenant_id")
      .select(
        "tenants.id",
        "tenants.name",
        "tenants.email",
        "tenants.password",
        "tenants.created_at",
        "tenant_api.key as api_key",
      )
      .limit(limit);

    const tenants: Tenant[] = raw.map((tenantRaw) =>
      TenantMapper.toDomain(tenantRaw),
    );

    return tenants;
  }
}
