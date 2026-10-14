import type { Tenant } from "../entities/tenant.entity";

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
  update(tenant: Tenant): Promise<void>;
  findById(id: string): Promise<Tenant | null>;
  findByEmail(email: string): Promise<Tenant | null>;
  list(page: number, limit: number): Promise<Tenant[]>;
}
