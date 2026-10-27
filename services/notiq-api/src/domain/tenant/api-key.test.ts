import { describe, expect, it } from "bun:test";
import { ApiKey } from "./domain/value-objects/api-key.vo";
import { ApiKeyEntity } from "./domain/entities/api-key.entity";
import { TenantApiKeyInvalidError } from "./domain/errors/tenant-api-key-invalid.error";
import { ApiKeyRevokedError } from "./domain/errors/api-key-revoked.error";
import { ApiKeyNotFoundError } from "./domain/errors/api-key-not-found.error";
import { ApiKeyNameInvalidError } from "./domain/errors/api-key-name-invalid.error";
import { CreateApiKeyUseCase } from "./application/use-cases/create-api-key.use-case";
import { RevokeApiKeyUseCase } from "./application/use-cases/revoke-api-key.use-case";
import { ListApiKeysUseCase } from "./application/use-cases/list-api-keys.use-case";
import { GetTenantByApiKeyUseCase } from "./application/use-cases/get-tenant-by-api-key.use-case";
import type { IApiKeyRepository } from "./domain/repositories/api-key-repository.interface";
import type { ITenantRepository } from "./domain/repositories/tenant-repository.interface";
import { Tenant } from "./domain/entities/tenant.entity";
import { Password } from "./domain/value-objects/password.vo";
import { ApiKeyMapper } from "./infrastructure/mappers/api-key.mapper";
import { createApiValidator } from "../../infra/http/middleware/api-validator";
import type { DomainEvent } from "../shared/events";
import type { IEventDispatcher } from "../shared/ports";
import { NotFoundError } from "../shared/errors/not-found-error";

class MockApiKeyRepository implements IApiKeyRepository {
  public keys: Map<string, ApiKeyEntity> = new Map();

  async save(apiKey: ApiKeyEntity): Promise<void> {
    this.keys.set(apiKey.id, apiKey);
  }

  async update(apiKey: ApiKeyEntity): Promise<void> {
    this.keys.set(apiKey.id, apiKey);
  }

  async findById(id: string): Promise<ApiKeyEntity | null> {
    return this.keys.get(id) || null;
  }

  async findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null> {
    for (const k of this.keys.values()) {
      if (k.keyHash === keyHash) return k;
    }
    return null;
  }

  async listByTenantId(tenantId: string): Promise<ApiKeyEntity[]> {
    return Array.from(this.keys.values()).filter(
      (k) => k.tenantId === tenantId,
    );
  }
}

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

  async findByApiKey(_apiKey: string): Promise<Tenant | null> {
    return null;
  }
}

class MockEventDispatcher implements IEventDispatcher {
  public dispatched: DomainEvent[] = [];

  async dispatch(events: DomainEvent[]): Promise<void> {
    this.dispatched.push(...events);
  }
}

describe("ApiKey Value Object", () => {
  it("should generate a valid api key matching ntk_ format", () => {
    const apiKey = ApiKey.generate();
    expect(apiKey.value.startsWith("ntk_")).toBe(true);
    expect(apiKey.value.length).toBe(36); // ntk_ (4) + 32 hex chars
  });

  it("should create ApiKey when valid format is provided", () => {
    const raw = "ntk_" + "a".repeat(32);
    const apiKey = ApiKey.create(raw);
    expect(apiKey.value).toBe(raw);
  });

  it("should throw TenantApiKeyInvalidError when invalid format is provided", () => {
    expect(() => ApiKey.create("invalid-key")).toThrow(
      TenantApiKeyInvalidError,
    );
    expect(() => ApiKey.create("ntk_short")).toThrow(TenantApiKeyInvalidError);
  });

  it("should calculate sha256 hash properly", () => {
    const apiKey = ApiKey.generate();
    const hash1 = apiKey.hash();
    const hash2 = apiKey.hash();
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});

describe("ApiKeyEntity Domain Entity", () => {
  it("should create an active ApiKeyEntity and emit ApiKeyCreatedEvent", () => {
    const entity = ApiKeyEntity.create({
      tenantId: "tenant-123",
      keyHash: "hash-xyz",
      name: "Production Key",
    });

    expect(entity.id).toBeDefined();
    expect(entity.tenantId).toBe("tenant-123");
    expect(entity.keyHash).toBe("hash-xyz");
    expect(entity.name).toBe("Production Key");
    expect(entity.isRevoked).toBe(false);
    expect(entity.revokedAt).toBeNull();
    expect(entity.events.length).toBe(1);
  });

  it("should throw ApiKeyNameInvalidError for empty or whitespace-only name", () => {
    expect(() =>
      ApiKeyEntity.create({
        tenantId: "tenant-123",
        keyHash: "hash-xyz",
        name: "   ",
      }),
    ).toThrow(ApiKeyNameInvalidError);
  });

  it("should revoke key and emit ApiKeyRevokedEvent", () => {
    const entity = ApiKeyEntity.create({
      tenantId: "tenant-123",
      keyHash: "hash-xyz",
      name: "Production Key",
    });
    entity.clearEvents();

    entity.revoke();
    expect(entity.isRevoked).toBe(true);
    expect(entity.revokedAt).toBeInstanceOf(Date);
    expect(entity.events.length).toBe(1);

    expect(() => entity.revoke()).toThrow(ApiKeyRevokedError);
  });
});

describe("ApiKey Application Use Cases", () => {
  it("CreateApiKeyUseCase should generate a new key and return raw key", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();
    const dispatcher = new MockEventDispatcher();

    const tenant = Tenant.create({
      name: "Acme",
      email: "acme@test.com",
      password: Password.create("hashed_pw_123"),
    });
    await tenantRepo.save(tenant);

    const useCase = new CreateApiKeyUseCase(tenantRepo, keyRepo, dispatcher);
    const result = await useCase.execute({
      tenantId: tenant.id,
      name: "Main Key",
    });

    expect(result.rawKey.startsWith("ntk_")).toBe(true);
    expect(result.apiKey.name).toBe("Main Key");
    expect(result.apiKey.tenantId).toBe(tenant.id);
    expect(await keyRepo.findById(result.apiKey.id)).not.toBeNull();
    expect(dispatcher.dispatched.length).toBe(1);
  });

  it("CreateApiKeyUseCase should throw NotFoundError for non-existent tenant", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();
    const dispatcher = new MockEventDispatcher();
    const useCase = new CreateApiKeyUseCase(tenantRepo, keyRepo, dispatcher);

    expect(
      useCase.execute({
        tenantId: "non-existent-id",
        name: "Main Key",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("RevokeApiKeyUseCase should revoke an active key", async () => {
    const keyRepo = new MockApiKeyRepository();
    const dispatcher = new MockEventDispatcher();
    const entity = ApiKeyEntity.create({
      tenantId: "tenant-1",
      keyHash: "hash-1",
      name: "Old Key",
    });
    entity.clearEvents();
    await keyRepo.save(entity);

    const useCase = new RevokeApiKeyUseCase(keyRepo, dispatcher);
    const revoked = await useCase.execute({
      tenantId: "tenant-1",
      keyId: entity.id,
    });

    expect(revoked.isRevoked).toBe(true);
    expect(dispatcher.dispatched.length).toBe(1);
  });

  it("RevokeApiKeyUseCase should throw ApiKeyNotFoundError on mismatched tenant", async () => {
    const keyRepo = new MockApiKeyRepository();
    const dispatcher = new MockEventDispatcher();
    const entity = ApiKeyEntity.create({
      tenantId: "tenant-1",
      keyHash: "hash-1",
      name: "Old Key",
    });
    entity.clearEvents();
    await keyRepo.save(entity);

    const useCase = new RevokeApiKeyUseCase(keyRepo, dispatcher);
    expect(
      useCase.execute({
        tenantId: "other-tenant",
        keyId: entity.id,
      }),
    ).rejects.toThrow(ApiKeyNotFoundError);
  });

  it("ListApiKeysUseCase should list keys for tenant", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();

    const tenant = Tenant.create({
      name: "Acme",
      email: "acme@test.com",
      password: Password.create("hashed_pw_123"),
    });
    await tenantRepo.save(tenant);

    const key1 = ApiKeyEntity.create({
      tenantId: tenant.id,
      keyHash: "hash1",
      name: "Key 1",
    });
    const key2 = ApiKeyEntity.create({
      tenantId: tenant.id,
      keyHash: "hash2",
      name: "Key 2",
    });
    await keyRepo.save(key1);
    await keyRepo.save(key2);

    const useCase = new ListApiKeysUseCase(tenantRepo, keyRepo);
    const list = await useCase.execute({ tenantId: tenant.id });
    expect(list.length).toBe(2);
  });

  it("GetTenantByApiKeyUseCase should verify valid key and return tenant", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();

    const tenant = Tenant.create({
      name: "Acme",
      email: "acme@test.com",
      password: Password.create("hashed_pw_123"),
    });
    await tenantRepo.save(tenant);

    const rawApiKey = ApiKey.generate();
    const entity = ApiKeyEntity.create({
      tenantId: tenant.id,
      keyHash: rawApiKey.hash(),
      name: "Active Key",
    });
    await keyRepo.save(entity);

    const useCase = new GetTenantByApiKeyUseCase(tenantRepo, keyRepo);
    const foundTenant = await useCase.execute({ apiKey: rawApiKey.value });
    expect(foundTenant.id).toBe(tenant.id);
  });

  it("GetTenantByApiKeyUseCase should reject revoked key", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();

    const tenant = Tenant.create({
      name: "Acme",
      email: "acme@test.com",
      password: Password.create("hashed_pw_123"),
    });
    await tenantRepo.save(tenant);

    const rawApiKey = ApiKey.generate();
    const entity = ApiKeyEntity.create({
      tenantId: tenant.id,
      keyHash: rawApiKey.hash(),
      name: "Revoked Key",
    });
    entity.revoke();
    await keyRepo.save(entity);

    const useCase = new GetTenantByApiKeyUseCase(tenantRepo, keyRepo);
    expect(useCase.execute({ apiKey: rawApiKey.value })).rejects.toThrow(
      ApiKeyRevokedError,
    );
  });
});

describe("ApiKeyMapper", () => {
  it("should map between domain and response DTO without exposing hash", () => {
    const entity = ApiKeyEntity.create({
      tenantId: "t-1",
      keyHash: "secret-hash-12345",
      name: "Public Key",
    });

    const response = ApiKeyMapper.toResponse(entity);
    expect(response.id).toBe(entity.id);
    expect(response.name).toBe("Public Key");
    expect(response.status).toBe("active");
    expect((response as any).key).toBeUndefined();
    expect((response as any).keyHash).toBeUndefined();
  });
});

describe("apiValidator Middleware", () => {
  it("should return 401 when x-api-key header is missing", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();
    const useCase = new GetTenantByApiKeyUseCase(tenantRepo, keyRepo);
    const middleware = createApiValidator(useCase);

    let status = 0;
    let jsonBody: any = null;
    const req: any = { headers: {} };
    const res: any = {
      status: (code: number) => {
        status = code;
        return {
          json: (body: any) => {
            jsonBody = body;
          },
        };
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await middleware(req, res, next);
    expect(status).toBe(401);
    expect(jsonBody.code).toBe("UNAUTHORIZED");
    expect(nextCalled).toBe(false);
  });

  it("should authenticate and inject tenant onto req when x-api-key is valid", async () => {
    const tenantRepo = new MockTenantRepository();
    const keyRepo = new MockApiKeyRepository();

    const tenant = Tenant.create({
      name: "Acme",
      email: "acme@test.com",
      password: Password.create("hashed_pw_123"),
    });
    await tenantRepo.save(tenant);

    const rawApiKey = ApiKey.generate();
    const entity = ApiKeyEntity.create({
      tenantId: tenant.id,
      keyHash: rawApiKey.hash(),
      name: "Active Key",
    });
    await keyRepo.save(entity);

    const useCase = new GetTenantByApiKeyUseCase(tenantRepo, keyRepo);
    const middleware = createApiValidator(useCase);

    const req: any = {
      headers: {
        "x-api-key": rawApiKey.value,
      },
    };
    const res: any = {};
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await middleware(req, res, next);
    expect(nextCalled).toBe(true);
    expect(req.tenant.id).toBe(tenant.id);
    expect(req.tenantId).toBe(tenant.id);
  });
});
