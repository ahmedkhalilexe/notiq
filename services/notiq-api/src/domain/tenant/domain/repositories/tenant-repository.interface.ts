import type { Tenant } from "../entities/tenant.entity";

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
}
