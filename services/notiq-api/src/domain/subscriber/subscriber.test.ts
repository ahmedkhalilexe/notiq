import { describe, expect, it } from "bun:test";
import { Subscriber } from "./domain/entities/subscriber.entity";
import { SubscriberChannelPreference } from "./domain/value-objects/subscriber-channel-preference.vo";
import { SubscriberIdentifierMissingError } from "./domain/errors/subscriber-identifier-missing.error";
import { SubscriberEmailExistsError } from "./domain/errors/subscriber-email-exists.error";
import { SubscriberExternalIdExistsError } from "./domain/errors/subscriber-external-id-exists.error";
import { SubscriberNotFoundError } from "./domain/errors/subscriber-not-found.error";
import { SubscriberInvalidChannelError } from "./domain/errors/subscriber-invalid-channel.error";
import { CreateSubscriberUseCase } from "./application/use-cases/create-subscriber.use-case";
import { GetSubscriberUseCase } from "./application/use-cases/get-subscriber.use-case";
import { UpdateSubscriberUseCase } from "./application/use-cases/update-subscriber.use-case";
import { UpdateSubscriberPreferenceUseCase } from "./application/use-cases/update-subscriber-preference.use-case";
import { DeleteSubscriberUseCase } from "./application/use-cases/delete-subscriber.use-case";
import { ListSubscribersUseCase } from "./application/use-cases/list-subscribers.use-case";
import type {
  ISubscriberRepository,
  ListSubscribersFilter,
} from "./domain/repositories/subscriber-repository.interface";
import type { IEventDispatcher } from "../shared/ports";
import type { DomainEvent } from "../shared/events";
import { SubscriberMapper } from "./infrastructure/mappers/subscriber.mapper";
import {
  createSubscriberSchema,
  updateSubscriberSchema,
  updatePreferenceSchema,
  listSubscribersQuerySchema,
} from "./infrastructure/http/subscriber.validator";

class MockSubscriberRepository implements ISubscriberRepository {
  public subscribers: Map<string, Subscriber> = new Map();

  async save(subscriber: Subscriber): Promise<void> {
    this.subscribers.set(subscriber.id, subscriber);
  }

  async update(subscriber: Subscriber): Promise<void> {
    this.subscribers.set(subscriber.id, subscriber);
  }

  async findById(id: string, tenantId?: string): Promise<Subscriber | null> {
    const s = this.subscribers.get(id);
    if (!s || s.deletedAt !== null) return null;
    if (tenantId && s.tenantId !== tenantId) return null;
    return s;
  }

  async findByEmail(email: string, tenantId: string): Promise<Subscriber | null> {
    const normalized = email.toLowerCase().trim();
    for (const s of this.subscribers.values()) {
      if (
        s.email?.toLowerCase() === normalized &&
        s.tenantId === tenantId &&
        s.deletedAt === null
      ) {
        return s;
      }
    }
    return null;
  }

  async findByExternalId(
    externalId: string,
    tenantId: string,
  ): Promise<Subscriber | null> {
    const normalized = externalId.trim();
    for (const s of this.subscribers.values()) {
      if (
        s.externalId === normalized &&
        s.tenantId === tenantId &&
        s.deletedAt === null
      ) {
        return s;
      }
    }
    return null;
  }

  async list(filter: ListSubscribersFilter): Promise<Subscriber[]> {
    let result = Array.from(this.subscribers.values()).filter(
      (s) => s.deletedAt === null,
    );

    if (filter.tenantId) {
      result = result.filter((s) => s.tenantId === filter.tenantId);
    }

    if (filter.channel !== undefined || filter.enabled !== undefined) {
      result = result.filter((s) => {
        if (filter.channel) {
          const pref = s.getChannelPreference(filter.channel);
          if (!pref) return false;
          if (filter.enabled !== undefined) {
            return pref.enabled === filter.enabled;
          }
          return true;
        }
        if (filter.enabled !== undefined) {
          return s.getChannels().some((ch) => ch.enabled === filter.enabled);
        }
        return true;
      });
    }

    const offset = Math.max(0, (filter.page - 1) * filter.limit);
    return result.slice(offset, offset + filter.limit);
  }

  async count(
    filter: Omit<ListSubscribersFilter, "page" | "limit">,
  ): Promise<number> {
    const list = await this.list({ ...filter, page: 1, limit: 100000 });
    return list.length;
  }
}

class MockEventDispatcher implements IEventDispatcher {
  public dispatched: DomainEvent[] = [];

  async dispatch(events: DomainEvent[]): Promise<void> {
    this.dispatched.push(...events);
  }
}

describe("Subscriber Domain Entity & Value Objects", () => {
  it("should create a valid subscriber with email, auto-create email channel, and emit SubscriberCreatedEvent", () => {
    const subscriber = Subscriber.create({
      tenantId: "tenant-1",
      email: "alex@example.com",
      name: "Alex",
    });

    expect(subscriber.id).toBeDefined();
    expect(subscriber.tenantId).toBe("tenant-1");
    expect(subscriber.email).toBe("alex@example.com");
    expect(subscriber.name).toBe("Alex");
    expect(subscriber.deletedAt).toBeNull();
    expect(subscriber.events.length).toBe(1);

    const emailChannel = subscriber.getChannelPreference("email");
    expect(emailChannel).toBeDefined();
    expect(emailChannel?.enabled).toBe(true);
    expect(emailChannel?.value).toBe("alex@example.com");
  });

  it("should throw SubscriberIdentifierMissingError if no email, phone, or externalId provided", () => {
    expect(() =>
      Subscriber.create({
        tenantId: "tenant-1",
        name: "Anonymous User",
      }),
    ).toThrow(SubscriberIdentifierMissingError);
  });

  it("should normalize in-app channel to in_app and validate allowed channels", () => {
    const pref = SubscriberChannelPreference.create("in-app", true, "token_123");
    expect(pref.channel).toBe("in_app");
    expect(pref.enabled).toBe(true);
    expect(pref.value).toBe("token_123");

    expect(() => SubscriberChannelPreference.create("carrier_pigeon")).toThrow(
      SubscriberInvalidChannelError,
    );
  });

  it("should support updating channel preferences (opt-in / opt-out)", () => {
    const subscriber = Subscriber.create({
      tenantId: "tenant-1",
      email: "user@example.com",
      phone: "+1234567890",
    });
    subscriber.clearEvents();

    expect(subscriber.isChannelEnabled("sms")).toBe(true);

    subscriber.setChannelPreference("sms", false);

    expect(subscriber.isChannelEnabled("sms")).toBe(false);
    expect(subscriber.getChannelPreference("sms")?.enabled).toBe(false);
    expect(subscriber.events.length).toBe(1);
  });

  it("should update profile details and sync channel values", () => {
    const subscriber = Subscriber.create({
      tenantId: "tenant-1",
      email: "old@example.com",
    });
    subscriber.clearEvents();

    subscriber.updateProfile({
      name: "Updated Name",
      email: "new@example.com",
      phone: "+9988776655",
    });

    expect(subscriber.name).toBe("Updated Name");
    expect(subscriber.email).toBe("new@example.com");
    expect(subscriber.phone).toBe("+9988776655");
    expect(subscriber.getChannelPreference("email")?.value).toBe(
      "new@example.com",
    );
    expect(subscriber.events.length).toBe(1);
  });

  it("should soft delete subscriber and prevent duplicate deletion or updates", () => {
    const subscriber = Subscriber.create({
      tenantId: "tenant-1",
      externalId: "ext-1",
    });
    subscriber.clearEvents();

    subscriber.delete();
    expect(subscriber.deletedAt).not.toBeNull();
    expect(subscriber.events.length).toBe(1);

    expect(() => subscriber.delete()).toThrow("Subscriber already deleted");
    expect(() => subscriber.updateProfile({ name: "Cannot" })).toThrow(
      "Cannot update a deleted subscriber",
    );
    expect(() => subscriber.setChannelPreference("email", false)).toThrow(
      "Cannot update preferences for a deleted subscriber",
    );
  });
});

describe("Subscriber Application Use Cases", () => {
  it("CreateSubscriberUseCase should create subscriber and reject duplicate email/externalId per tenant", async () => {
    const repo = new MockSubscriberRepository();
    const dispatcher = new MockEventDispatcher();
    const useCase = new CreateSubscriberUseCase(repo, dispatcher);

    const sub1 = await useCase.execute({
      tenantId: "tenant-1",
      email: "duplicate@example.com",
      externalId: "ext-123",
      name: "User 1",
    });

    expect(repo.subscribers.has(sub1.id)).toBe(true);
    expect(dispatcher.dispatched.length).toBe(1);

    expect(
      useCase.execute({
        tenantId: "tenant-1",
        email: "duplicate@example.com",
      }),
    ).rejects.toThrow(SubscriberEmailExistsError);

    expect(
      useCase.execute({
        tenantId: "tenant-1",
        externalId: "ext-123",
      }),
    ).rejects.toThrow(SubscriberExternalIdExistsError);

    const subTenant2 = await useCase.execute({
      tenantId: "tenant-2",
      email: "duplicate@example.com",
      externalId: "ext-123",
    });
    expect(subTenant2.tenantId).toBe("tenant-2");
  });

  it("GetSubscriberUseCase should retrieve subscriber or throw SubscriberNotFoundError", async () => {
    const repo = new MockSubscriberRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateSubscriberUseCase(repo, dispatcher);
    const getUseCase = new GetSubscriberUseCase(repo);

    const created = await createUseCase.execute({
      tenantId: "tenant-1",
      email: "find@example.com",
    });

    const found = await getUseCase.execute({ id: created.id, tenantId: "tenant-1" });
    expect(found.id).toBe(created.id);

    expect(
      getUseCase.execute({ id: "00000000-0000-0000-0000-000000000000" }),
    ).rejects.toThrow(SubscriberNotFoundError);
  });

  it("UpdateSubscriberPreferenceUseCase should toggle channel opt-in/opt-out", async () => {
    const repo = new MockSubscriberRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateSubscriberUseCase(repo, dispatcher);
    const prefUseCase = new UpdateSubscriberPreferenceUseCase(repo, dispatcher);

    const created = await createUseCase.execute({
      tenantId: "tenant-1",
      email: "optout@example.com",
    });

    const updated = await prefUseCase.execute({
      id: created.id,
      channel: "email",
      enabled: false,
    });

    expect(updated.isChannelEnabled("email")).toBe(false);
  });

  it("ListSubscribersUseCase should filter by channel preference (opt-in/opt-out) and paginate", async () => {
    const repo = new MockSubscriberRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateSubscriberUseCase(repo, dispatcher);
    const prefUseCase = new UpdateSubscriberPreferenceUseCase(repo, dispatcher);
    const listUseCase = new ListSubscribersUseCase(repo);

    const s1 = await createUseCase.execute({
      tenantId: "tenant-1",
      email: "s1@example.com",
      phone: "+111",
    });
    const s2 = await createUseCase.execute({
      tenantId: "tenant-1",
      email: "s2@example.com",
      phone: "+222",
    });

    await prefUseCase.execute({
      id: s1.id,
      channel: "sms",
      enabled: false,
    });

    const smsOptedOut = await listUseCase.execute({
      tenantId: "tenant-1",
      channel: "sms",
      enabled: false,
    });
    expect(smsOptedOut.length).toBe(1);
    expect(smsOptedOut[0]?.id).toBe(s1.id);

    const smsOptedIn = await listUseCase.execute({
      tenantId: "tenant-1",
      channel: "sms",
      enabled: true,
    });
    expect(smsOptedIn.length).toBe(1);
    expect(smsOptedIn[0]?.id).toBe(s2.id);

    const paginated = await listUseCase.execute({
      tenantId: "tenant-1",
      page: 1,
      limit: 1,
    });
    expect(paginated.length).toBe(1);
  });

  it("DeleteSubscriberUseCase should soft delete subscriber", async () => {
    const repo = new MockSubscriberRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateSubscriberUseCase(repo, dispatcher);
    const deleteUseCase = new DeleteSubscriberUseCase(repo, dispatcher);

    const created = await createUseCase.execute({
      tenantId: "tenant-1",
      externalId: "del-me",
    });

    await deleteUseCase.execute({ id: created.id });

    const found = await repo.findById(created.id);
    expect(found).toBeNull();
  });
});

describe("SubscriberMapper & Validators", () => {
  it("should map between domain, persistence, and HTTP response DTO", () => {
    const subscriber = Subscriber.create({
      tenantId: "tenant-1",
      externalId: "ext-1",
      email: "map@example.com",
      phone: "+123",
      channels: [
        SubscriberChannelPreference.create("in_app", true, "push_token_999"),
      ],
    });

    const persistence = SubscriberMapper.toPersistence(subscriber);
    expect(persistence.email).toBe("map@example.com");
    expect(persistence.external_id).toBe("ext-1");

    const domain = SubscriberMapper.toDomain(persistence, [
      {
        subscriber_id: subscriber.id,
        channel: "in_app",
        value: "push_token_999",
        enabled: true,
      },
    ]);
    expect(domain.id).toBe(subscriber.id);
    expect(domain.getChannelPreference("in_app")?.value).toBe("push_token_999");

    const response = SubscriberMapper.toResponse(domain);
    expect(response.id).toBe(subscriber.id);
    expect(response.channels.length).toBe(1);
    expect(response.channels[0]?.channel).toBe("in_app");
  });

  it("should validate create, update, and preference schemas", () => {
    const { error: validCreate } = createSubscriberSchema.validate({
      email: "valid@example.com",
      channels: [{ channel: "email", enabled: true }],
    });
    expect(validCreate).toBeUndefined();

    const { error: invalidEmail } = createSubscriberSchema.validate({
      email: "not-an-email",
    });
    expect(invalidEmail).toBeDefined();

    const { error: validPref } = updatePreferenceSchema.validate({
      channel: "email",
      enabled: false,
    });
    expect(validPref).toBeUndefined();

    const { error: invalidPrefChannel } = updatePreferenceSchema.validate({
      channel: "telegram",
      enabled: true,
    });
    expect(invalidPrefChannel).toBeDefined();

    const { error: validQuery } = listSubscribersQuerySchema.validate({
      page: 1,
      limit: 10,
      channel: "sms",
      enabled: false,
    });
    expect(validQuery).toBeUndefined();
  });
});
