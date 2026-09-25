import { describe, expect, it } from "bun:test";
import { Tenant } from "./domain/entities/tenant.entity";
import { ApiKey } from "./domain/value-objects/api-key.vo";
import { Password } from "./domain/value-objects/password.vo";
import { TenantNameInvalidError } from "./domain/errors/tenant-name-invalid.error";
import { TenantEmailInvalidError } from "./domain/errors/tenant-email-invalid.error";
import { TenantEmailExistsError } from "./domain/errors/tenant-email-exists.error";
import { CreateTenantUseCase } from "./application/use-cases/create-tenant.use-case";
import { FindByIdTenantUsecase } from "./application/use-cases/get-tenant.use-case";
import { ListTenantUsecase } from "./application/use-cases/list-tenant.use-case";
import { DeleteTenantUsecase } from "./application/use-cases/delete-tenant.use-case";
import type { ITenantRepository } from "./domain/repositories/tenant-repository.interface";
import type { IEventDispatcher } from "../shared/ports";
import type { DomainEvent } from "../shared/events";
import { TenantMapper } from "./infrastructure/mappers/tenant.mapper";
import {
  createTenantSchema,
  findByIdTenantSchema,
  deleteTenantSchema,
} from "./infrastructure/http/tenant.validator";
import { NotFoundError } from "../shared/errors/not-found-error";

class MockTenantRepository implements ITenantRepository {
  public tenants: Map<string, Tenant> = new Map();

  async save(tenant: Tenant): Promise<void> {
    this.tenants.set(tenant.id, tenant);
  }

  async update(tenant: Tenant): Promise<void> {
    this.tenants.set(tenant.id, tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    const t = this.tenants.get(id);
    if (!t || t.deletedAt !== null) return null;
    return t;
  }

  async findByEmail(email: string): Promise<Tenant | null> {
    const normalized = email.toLowerCase().trim();
    for (const t of this.tenants.values()) {
      if (t.email.toLowerCase() === normalized && t.deletedAt === null) {
        return t;
      }
    }
    return null;
  }

  async list(page: number, limit: number): Promise<Tenant[]> {
    const active = Array.from(this.tenants.values()).filter(
      (t) => t.deletedAt === null,
    );
    const offset = Math.max(0, (page - 1) * limit);
    return active.slice(offset, offset + limit);
  }
}

class MockEventDispatcher implements IEventDispatcher {
  public dispatched: DomainEvent[] = [];

  async dispatch(events: DomainEvent[]): Promise<void> {
    this.dispatched.push(...events);
  }
}

describe("Tenant Domain Entity", () => {
  it("should create a valid tenant and generate API key and TenantCreatedEvent", () => {
    const password = Password.create("hashed_pw_123");
    const tenant = Tenant.create({
      name: "Acme Corp",
      email: "admin@acme.com",
      password,
    });

    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBe("Acme Corp");
    expect(tenant.email).toBe("admin@acme.com");
    expect(tenant.apiKey.value.startsWith("ntk_")).toBe(true);
    expect(tenant.deletedAt).toBeNull();
    expect(tenant.events.length).toBe(1);
  });

  it("should throw error if name is too short or too long", () => {
    const password = Password.create("hashed_pw_123");

    expect(() =>
      Tenant.create({ name: "A", email: "valid@acme.com", password }),
    ).toThrow(TenantNameInvalidError);

    expect(() =>
      Tenant.create({
        name: "A".repeat(101),
        email: "valid@acme.com",
        password,
      }),
    ).toThrow(TenantNameInvalidError);
  });

  it("should throw error if email is invalid", () => {
    const password = Password.create("hashed_pw_123");

    expect(() =>
      Tenant.create({ name: "Acme", email: "invalid-email", password }),
    ).toThrow(TenantEmailInvalidError);
  });

  it("should support soft deletion and prevent duplicate deletion", () => {
    const tenant = Tenant.create({
      name: "Acme Corp",
      email: "admin@acme.com",
      password: Password.create("hashed_pw"),
    });
    tenant.clearEvents();

    tenant.delete();
    expect(tenant.deletedAt).not.toBeNull();
    expect(tenant.events.length).toBe(1);

    expect(() => tenant.delete()).toThrow("tenant already deleted");
  });

  it("should reconstitute an existing tenant", () => {
    const apiKey = ApiKey.create("ntk_12345");
    const password = Password.create("hashed_password");
    const now = new Date();

    const tenant = Tenant.reconstitute(
      "uuid-123",
      "Reconstituted Tenant",
      "reconstituted@acme.com",
      password,
      apiKey,
      now,
      null,
    );

    expect(tenant.id).toBe("uuid-123");
    expect(tenant.apiKey.value).toBe("ntk_12345");
    expect(tenant.createdAt).toEqual(now);
  });
});

describe("Tenant Application Use Cases", () => {
  it("CreateTenantUseCase should create tenant, hash password, and emit event", async () => {
    const repo = new MockTenantRepository();
    const dispatcher = new MockEventDispatcher();
    const useCase = new CreateTenantUseCase(repo, dispatcher);

    const tenant = await useCase.execute({
      name: "New Tenant",
      email: "new@example.com",
      password: "StrongPassword123!",
    });

    expect(repo.tenants.has(tenant.id)).toBe(true);
    expect(dispatcher.dispatched.length).toBe(1);
    expect(tenant.password.value).not.toBe("StrongPassword123!");
  });

  it("CreateTenantUseCase should reject duplicate email with TenantEmailExistsError", async () => {
    const repo = new MockTenantRepository();
    const dispatcher = new MockEventDispatcher();
    const useCase = new CreateTenantUseCase(repo, dispatcher);

    await useCase.execute({
      name: "Tenant One",
      email: "shared@example.com",
      password: "Password123!",
    });

    expect(
      useCase.execute({
        name: "Tenant Two",
        email: "shared@example.com",
        password: "Password456!",
      }),
    ).rejects.toThrow(TenantEmailExistsError);
  });

  it("FindByIdTenantUsecase should return tenant or throw NotFoundError", async () => {
    const repo = new MockTenantRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTenantUseCase(repo, dispatcher);
    const getUseCase = new FindByIdTenantUsecase(repo);

    const created = await createUseCase.execute({
      name: "Find Me",
      email: "findme@example.com",
      password: "Password123!",
    });

    const found = await getUseCase.execute({ id: created.id });
    expect(found.id).toBe(created.id);

    expect(
      getUseCase.execute({ id: "00000000-0000-0000-0000-000000000000" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("ListTenantUsecase should paginate and exclude soft-deleted tenants", async () => {
    const repo = new MockTenantRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTenantUseCase(repo, dispatcher);
    const listUseCase = new ListTenantUsecase(repo);
    const deleteUseCase = new DeleteTenantUsecase(repo, dispatcher);

    const t1 = await createUseCase.execute({
      name: "Tenant 1",
      email: "t1@example.com",
      password: "Password123!",
    });
    await createUseCase.execute({
      name: "Tenant 2",
      email: "t2@example.com",
      password: "Password123!",
    });

    const page1 = await listUseCase.execute({ page: 1, limit: 1 });
    expect(page1.length).toBe(1);

    await deleteUseCase.execute(t1.id);
    const remaining = await listUseCase.execute({ page: 1, limit: 10 });
    expect(remaining.length).toBe(1);
    expect(remaining[0]?.id).not.toBe(t1.id);
  });

  it("DeleteTenantUsecase should soft delete tenant", async () => {
    const repo = new MockTenantRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTenantUseCase(repo, dispatcher);
    const deleteUseCase = new DeleteTenantUsecase(repo, dispatcher);

    const tenant = await createUseCase.execute({
      name: "To Delete",
      email: "delete@example.com",
      password: "Password123!",
    });

    await deleteUseCase.execute(tenant.id);

    const found = await repo.findById(tenant.id);
    expect(found).toBeNull();
  });
});

describe("TenantMapper & Validator", () => {
  it("should map between domain, persistence, and response DTO", () => {
    const tenant = Tenant.create({
      name: "Mapper Test",
      email: "mapper@example.com",
      password: Password.create("hashed_pw"),
    });

    const persistence = TenantMapper.toPersistence(tenant);
    expect(persistence.name).toBe("Mapper Test");
    expect(persistence.email).toBe("mapper@example.com");

    const domain = TenantMapper.toDomain({
      ...persistence,
      api_key: tenant.apiKey.value,
    });
    expect(domain.name).toBe("Mapper Test");
    expect(domain.apiKey.value).toBe(tenant.apiKey.value);

    const response = TenantMapper.toResponse(domain);
    expect(response.id).toBe(tenant.id);
    expect(response.name).toBe("Mapper Test");
    expect(response.api_key).toBe(tenant.apiKey.value);
  });

  it("should validate createTenantSchema and findByIdTenantSchema", () => {
    const valid = {
      name: "Valid Tenant",
      email: "test@company.com",
      password: "SecurePassword1!",
    };
    const { error: validErr } = createTenantSchema.validate(valid);
    expect(validErr).toBeUndefined();

    const invalidEmail = { ...valid, email: "not-an-email" };
    const { error: emailErr } = createTenantSchema.validate(invalidEmail);
    expect(emailErr).toBeDefined();

    const weakPassword = { ...valid, password: "weak" };
    const { error: passErr } = createTenantSchema.validate(weakPassword);
    expect(passErr).toBeDefined();

    const { error: idErr } = findByIdTenantSchema.validate({
      id: "not-a-uuid",
    });
    expect(idErr).toBeDefined();

    const { error: validIdErr } = findByIdTenantSchema.validate({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(validIdErr).toBeUndefined();
  });
});
