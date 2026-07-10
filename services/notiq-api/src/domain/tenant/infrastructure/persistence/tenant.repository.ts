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
}
