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

  async list(page: number, limit: number): Promise<Tenant[]> {
    const offset = Math.max(0, (page - 1) * limit);

    const raw = await this.db("tenants")
      .whereNull("tenants.deleted_at")
      .select(
        "tenants.id",
        "tenants.name",
        "tenants.email",
        "tenants.password",
        "tenants.created_at",
        "tenants.deleted_at",
      )
      .orderBy("tenants.created_at", "desc")
      .offset(offset)
      .limit(limit);

    return raw.map((tenantRaw) => TenantMapper.toDomain(tenantRaw));
  }

  async findByApiKey(apiKeyHash: string): Promise<Tenant | null> {
    const raw = await this.db("tenant_api")
      .join("tenants", "tenant_api.tenant_id", "tenants.id")
      .where("tenant_api.key", apiKeyHash)
      .whereNull("tenant_api.revoked_at")
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
