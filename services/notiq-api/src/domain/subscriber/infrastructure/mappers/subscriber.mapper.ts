import { Subscriber } from "../../domain/entities/subscriber.entity";
import {
  SubscriberChannelPreference,
  type SupportedChannel,
} from "../../domain/value-objects/subscriber-channel-preference.vo";

export interface SubscriberPersistenceRow {
  id: string;
  tenant_id: string;
  external_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SubscriberChannelPersistenceRow {
  id?: string;
  subscriber_id: string;
  channel: string;
  value: string | null;
  enabled: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubscriberResponseDTO {
  id: string;
  tenant_id: string;
  external_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  channels: {
    channel: SupportedChannel;
    enabled: boolean;
    value: string | null;
  }[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class SubscriberMapper {
  static toDomain(
    raw: SubscriberPersistenceRow,
    channelsRaw: SubscriberChannelPersistenceRow[] = [],
  ): Subscriber {
    const channels = channelsRaw.map((ch) =>
      SubscriberChannelPreference.create(ch.channel, ch.enabled, ch.value),
    );

    return Subscriber.reconstitute(
      raw.id,
      raw.tenant_id,
      raw.external_id,
      raw.name,
      raw.email,
      raw.phone,
      channels,
      new Date(raw.created_at),
      new Date(raw.updated_at),
      raw.deleted_at ? new Date(raw.deleted_at) : null,
    );
  }

  static toPersistence(subscriber: Subscriber): SubscriberPersistenceRow {
    return {
      id: subscriber.id,
      tenant_id: subscriber.tenantId,
      external_id: subscriber.externalId,
      name: subscriber.name,
      email: subscriber.email,
      phone: subscriber.phone,
      created_at: subscriber.createdAt,
      updated_at: subscriber.updatedAt,
      deleted_at: subscriber.deletedAt,
    };
  }

  static toResponse(subscriber: Subscriber): SubscriberResponseDTO {
    return {
      id: subscriber.id,
      tenant_id: subscriber.tenantId,
      external_id: subscriber.externalId,
      name: subscriber.name,
      email: subscriber.email,
      phone: subscriber.phone,
      channels: subscriber.getChannels().map((ch) => ({
        channel: ch.channel,
        enabled: ch.enabled,
        value: ch.value,
      })),
      created_at: subscriber.createdAt,
      updated_at: subscriber.updatedAt,
      deleted_at: subscriber.deletedAt,
    };
  }
}
