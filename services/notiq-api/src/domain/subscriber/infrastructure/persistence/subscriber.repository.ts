import type { DbConnection } from "../../../../infra/database/connection";
import type { Subscriber } from "../../domain/entities/subscriber.entity";
import type {
  ISubscriberRepository,
  ListSubscribersFilter,
} from "../../domain/repositories/subscriber-repository.interface";
import {
  SubscriberMapper,
  type SubscriberChannelPersistenceRow,
  type SubscriberPersistenceRow,
} from "../mappers/subscriber.mapper";

export class SubscriberRepository implements ISubscriberRepository {
  public constructor(private readonly db: DbConnection) {}

  async save(subscriber: Subscriber): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("subscribers").insert(SubscriberMapper.toPersistence(subscriber));

      const channels = subscriber.getChannels();
      if (channels.length > 0) {
        await trx("subscriber_channels").insert(
          channels.map((ch) => ({
            id: crypto.randomUUID(),
            subscriber_id: subscriber.id,
            channel: ch.channel,
            value: ch.value,
            enabled: ch.enabled,
            created_at: subscriber.createdAt,
            updated_at: subscriber.updatedAt,
          })),
        );
      }
    });
  }

  async update(subscriber: Subscriber): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("subscribers")
        .where("id", subscriber.id)
        .update(SubscriberMapper.toPersistence(subscriber));

      await trx("subscriber_channels")
        .where("subscriber_id", subscriber.id)
        .delete();

      const channels = subscriber.getChannels();
      if (channels.length > 0) {
        const now = new Date();
        await trx("subscriber_channels").insert(
          channels.map((ch) => ({
            id: crypto.randomUUID(),
            subscriber_id: subscriber.id,
            channel: ch.channel,
            value: ch.value,
            enabled: ch.enabled,
            created_at: now,
            updated_at: now,
          })),
        );
      }
    });
  }

  async findById(id: string, tenantId?: string): Promise<Subscriber | null> {
    let query = this.db<SubscriberPersistenceRow>("subscribers")
      .where("id", id)
      .whereNull("deleted_at");

    if (tenantId) {
      query = query.where("tenant_id", tenantId);
    }

    const raw = await query.first();
    if (!raw) return null;

    const channelsRaw = await this.db<SubscriberChannelPersistenceRow>(
      "subscriber_channels",
    )
      .where("subscriber_id", id)
      .select("id", "subscriber_id", "channel", "value", "enabled");

    return SubscriberMapper.toDomain(raw, channelsRaw);
  }

  async findByEmail(
    email: string,
    tenantId: string,
  ): Promise<Subscriber | null> {
    const raw = await this.db<SubscriberPersistenceRow>("subscribers")
      .where("email", email.toLowerCase().trim())
      .where("tenant_id", tenantId)
      .whereNull("deleted_at")
      .first();

    if (!raw) return null;

    const channelsRaw = await this.db<SubscriberChannelPersistenceRow>(
      "subscriber_channels",
    )
      .where("subscriber_id", raw.id)
      .select("id", "subscriber_id", "channel", "value", "enabled");

    return SubscriberMapper.toDomain(raw, channelsRaw);
  }

  async findByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<Subscriber | null> {
    const raw = await this.db<SubscriberPersistenceRow>("subscribers")
      .where("external_id", externalId.trim())
      .where("tenant_id", tenantId)
      .whereNull("deleted_at")
      .first();

    if (!raw) return null;

    const channelsRaw = await this.db<SubscriberChannelPersistenceRow>(
      "subscriber_channels",
    )
      .where("subscriber_id", raw.id)
      .select("id", "subscriber_id", "channel", "value", "enabled");

    return SubscriberMapper.toDomain(raw, channelsRaw);
  }

  async list(filter: ListSubscribersFilter): Promise<Subscriber[]> {
    const offset = Math.max(0, (filter.page - 1) * filter.limit);

    let query = this.db<SubscriberPersistenceRow>("subscribers")
      .whereNull("subscribers.deleted_at")
      .offset(offset)
      .limit(filter.limit)
      .orderBy("subscribers.created_at", "desc");

    if (filter.tenantId) {
      query = query.where("subscribers.tenant_id", filter.tenantId);
    }

    let normalizedChannel = filter.channel?.toLowerCase().trim();
    if (normalizedChannel === "in-app") normalizedChannel = "in_app";

    if (normalizedChannel || filter.enabled !== undefined) {
      query = query.join(
        "subscriber_channels",
        "subscribers.id",
        "subscriber_channels.subscriber_id",
      );

      if (normalizedChannel) {
        query = query.where("subscriber_channels.channel", normalizedChannel);
      }

      if (filter.enabled !== undefined) {
        query = query.where("subscriber_channels.enabled", filter.enabled);
      }

      query = query.distinct("subscribers.*");
    }

    const rawSubscribers = await query;
    if (rawSubscribers.length === 0) return [];

    const subscriberIds = rawSubscribers.map((s) => s.id);
    const channelsRaw = await this.db<SubscriberChannelPersistenceRow>(
      "subscriber_channels",
    )
      .whereIn("subscriber_id", subscriberIds)
      .select("id", "subscriber_id", "channel", "value", "enabled");

    const channelMap = new Map<string, SubscriberChannelPersistenceRow[]>();
    for (const ch of channelsRaw) {
      if (!channelMap.has(ch.subscriber_id)) {
        channelMap.set(ch.subscriber_id, []);
      }
      channelMap.get(ch.subscriber_id)!.push(ch);
    }

    return rawSubscribers.map((raw) =>
      SubscriberMapper.toDomain(raw, channelMap.get(raw.id) || []),
    );
  }

  async count(
    filter: Omit<ListSubscribersFilter, "page" | "limit">,
  ): Promise<number> {
    let query = this.db("subscribers").whereNull("subscribers.deleted_at");

    if (filter.tenantId) {
      query = query.where("subscribers.tenant_id", filter.tenantId);
    }

    let normalizedChannel = filter.channel?.toLowerCase().trim();
    if (normalizedChannel === "in-app") normalizedChannel = "in_app";

    if (normalizedChannel || filter.enabled !== undefined) {
      query = query.join(
        "subscriber_channels",
        "subscribers.id",
        "subscriber_channels.subscriber_id",
      );

      if (normalizedChannel) {
        query = query.where("subscriber_channels.channel", normalizedChannel);
      }

      if (filter.enabled !== undefined) {
        query = query.where("subscriber_channels.enabled", filter.enabled);
      }

      const result = await query.countDistinct("subscribers.id as count").first();
      return Number(result?.count || 0);
    }

    const result = await query.count("subscribers.id as count").first();
    return Number(result?.count || 0);
  }
}
