import type { DomainEvent } from "../../../shared/events";
import { SubscriberIdentifierMissingError } from "../errors/subscriber-identifier-missing.error";
import { SubscriberCreatedEvent } from "../events/subscriber-created.event";
import { SubscriberUpdatedEvent } from "../events/subscriber-updated.event";
import { SubscriberDeletedEvent } from "../events/subscriber-deleted.event";
import { SubscriberPreferenceUpdatedEvent } from "../events/subscriber-preference-updated.event";
import {
  SubscriberChannelPreference,
  type SupportedChannel,
} from "../value-objects/subscriber-channel-preference.vo";

export interface CreateSubscriberParams {
  tenantId: string;
  externalId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  channels?: SubscriberChannelPreference[];
}

export class Subscriber {
  private _events: DomainEvent[] = [];
  private readonly _channels: Map<SupportedChannel, SubscriberChannelPreference> =
    new Map();

  public constructor(
    readonly id: string,
    readonly tenantId: string,
    private _externalId: string | null,
    private _name: string | null,
    private _email: string | null,
    private _phone: string | null,
    channels: SubscriberChannelPreference[] = [],
    readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null,
  ) {
    for (const ch of channels) {
      this._channels.set(ch.channel, ch);
    }
  }

  public static create(params: CreateSubscriberParams): Subscriber {
    const trimmedExternalId = params.externalId?.trim() || null;
    const trimmedName = params.name?.trim() || null;
    const trimmedEmail = params.email?.trim().toLowerCase() || null;
    const trimmedPhone = params.phone?.trim() || null;

    if (!trimmedExternalId && !trimmedEmail && !trimmedPhone) {
      throw new SubscriberIdentifierMissingError();
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const channelMap = new Map<SupportedChannel, SubscriberChannelPreference>();

    if (params.channels) {
      for (const ch of params.channels) {
        channelMap.set(ch.channel, ch);
      }
    }

    if (trimmedEmail && !channelMap.has("email")) {
      channelMap.set(
        "email",
        SubscriberChannelPreference.create("email", true, trimmedEmail),
      );
    }

    if (trimmedPhone && !channelMap.has("sms")) {
      channelMap.set(
        "sms",
        SubscriberChannelPreference.create("sms", true, trimmedPhone),
      );
    }

    const subscriber = new Subscriber(
      id,
      params.tenantId,
      trimmedExternalId,
      trimmedName,
      trimmedEmail,
      trimmedPhone,
      Array.from(channelMap.values()),
      now,
      now,
      null,
    );

    subscriber._events.push(new SubscriberCreatedEvent(subscriber.id, subscriber.tenantId));

    return subscriber;
  }

  public static reconstitute(
    id: string,
    tenantId: string,
    externalId: string | null,
    name: string | null,
    email: string | null,
    phone: string | null,
    channels: SubscriberChannelPreference[] = [],
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): Subscriber {
    return new Subscriber(
      id,
      tenantId,
      externalId,
      name,
      email,
      phone,
      channels,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }

  public updateProfile(params: {
    externalId?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  }): void {
    if (this._deletedAt !== null) {
      throw new Error("Cannot update a deleted subscriber");
    }

    const newExternalId =
      params.externalId !== undefined ? params.externalId?.trim() || null : this._externalId;
    const newName =
      params.name !== undefined ? params.name?.trim() || null : this._name;
    const newEmail =
      params.email !== undefined ? params.email?.trim().toLowerCase() || null : this._email;
    const newPhone =
      params.phone !== undefined ? params.phone?.trim() || null : this._phone;

    if (!newExternalId && !newEmail && !newPhone) {
      throw new SubscriberIdentifierMissingError();
    }

    this._externalId = newExternalId;
    this._name = newName;
    this._email = newEmail;
    this._phone = newPhone;
    this._updatedAt = new Date();

    if (newEmail && this._channels.has("email")) {
      const current = this._channels.get("email")!;
      this._channels.set("email", current.withValue(newEmail));
    }
    if (newPhone && this._channels.has("sms")) {
      const current = this._channels.get("sms")!;
      this._channels.set("sms", current.withValue(newPhone));
    }

    this._events.push(new SubscriberUpdatedEvent(this.id, this.tenantId));
  }

  public setChannelPreference(
    channel: string,
    enabled: boolean,
    value?: string | null,
  ): void {
    if (this._deletedAt !== null) {
      throw new Error("Cannot update preferences for a deleted subscriber");
    }

    const pref = SubscriberChannelPreference.create(
      channel,
      enabled,
      value !== undefined
        ? value
        : this._channels.get(channel as SupportedChannel)?.value ?? null,
    );

    this._channels.set(pref.channel, pref);
    this._updatedAt = new Date();

    this._events.push(
      new SubscriberPreferenceUpdatedEvent(
        this.id,
        this.tenantId,
        pref.channel,
        pref.enabled,
      ),
    );
  }

  public delete(): void {
    if (this._deletedAt !== null) {
      throw new Error("Subscriber already deleted");
    }

    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
    this._events.push(
      new SubscriberDeletedEvent(this.id, this.tenantId, this._deletedAt),
    );
  }

  public getChannels(): ReadonlyArray<SubscriberChannelPreference> {
    return Array.from(this._channels.values());
  }

  public getChannelPreference(
    channel: string,
  ): SubscriberChannelPreference | undefined {
    let normalized = channel.toLowerCase().trim();
    if (normalized === "in-app") normalized = "in_app";
    return this._channels.get(normalized as SupportedChannel);
  }

  public isChannelEnabled(channel: string): boolean {
    const pref = this.getChannelPreference(channel);
    // If not explicitly defined, default to enabled
    return pref ? pref.enabled : true;
  }

  get externalId(): string | null {
    return this._externalId;
  }

  get name(): string | null {
    return this._name;
  }

  get email(): string | null {
    return this._email;
  }

  get phone(): string | null {
    return this._phone;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get events(): DomainEvent[] {
    return [...this._events];
  }

  public clearEvents(): void {
    this._events = [];
  }
}
