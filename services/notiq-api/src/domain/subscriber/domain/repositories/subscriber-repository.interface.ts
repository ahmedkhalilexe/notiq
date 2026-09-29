import type { Subscriber } from "../entities/subscriber.entity";

export interface ListSubscribersFilter {
  tenantId?: string;
  page: number;
  limit: number;
  channel?: string;
  enabled?: boolean;
}

export interface ISubscriberRepository {
  save(subscriber: Subscriber): Promise<void>;
  update(subscriber: Subscriber): Promise<void>;
  findById(id: string, tenantId?: string): Promise<Subscriber | null>;
  findByEmail(email: string, tenantId: string): Promise<Subscriber | null>;
  findByExternalId(externalId: string, tenantId: string): Promise<Subscriber | null>;
  list(filter: ListSubscribersFilter): Promise<Subscriber[]>;
  count(filter: Omit<ListSubscribersFilter, "page" | "limit">): Promise<number>;
}
