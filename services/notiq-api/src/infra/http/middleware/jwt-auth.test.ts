import { describe, expect, it } from "bun:test";
import type { Request } from "express";
import { createJwtAuth, getTenantId } from "./jwt-auth";
import { TokenService } from "../../auth/token.service";
import { FindByIdTenantUsecase } from "../../../domain/tenant/application/use-cases/get-tenant.use-case";
import { Tenant } from "../../../domain/tenant/domain/entities/tenant.entity";
import { Password } from "../../../domain/tenant/domain/value-objects/password.vo";
import { UnauthorizedError } from "../../../domain/shared/errors/unauthorized-error";
import type { ITenantRepository } from "../../../domain/tenant/domain/repositories/tenant-repository.interface";

const tokens = new TokenService({ secret: "a".repeat(32), expiresIn: "1h" });

function setup() {
  const tenant = Tenant.create({
    name: "Acme",
    email: "acme@example.com",
    password: Password.create("hashed"),
  });
  const store = new Map<string, Tenant>([[tenant.id, tenant]]);
  const repo = {
    findById: async (id: string) => store.get(id) ?? null,
  } as unknown as ITenantRepository;
  const middleware = createJwtAuth(tokens, new FindByIdTenantUsecase(repo));
  return { tenant, store, middleware };
}

async function run(
  middleware: ReturnType<typeof createJwtAuth>,
  authorization?: string,
) {
  const req = { headers: { authorization } } as unknown as Request;
  let error: unknown;
  let called = false;
  await middleware(req, {} as any, (err?: unknown) => {
    called = true;
    error = err;
  });
  return { req, error, called };
}

describe("jwtAuth middleware", () => {
  it("rejects a missing Authorization header", async () => {
    const { middleware } = setup();
    const { error } = await run(middleware);
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a non-Bearer scheme and malformed headers", async () => {
    const { middleware, tenant } = setup();
    const token = tokens.sign({ tenantId: tenant.id });
    for (const header of [`Basic ${token}`, "Bearer", `Bearer ${token} extra`, token]) {
      const { error } = await run(middleware, header);
      expect(error).toBeInstanceOf(UnauthorizedError);
    }
  });

  it("rejects an invalid token", async () => {
    const { middleware } = setup();
    const { error } = await run(middleware, "Bearer not.a.jwt");
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a valid token for an unknown or deleted tenant", async () => {
    const { middleware, tenant, store } = setup();
    const token = tokens.sign({ tenantId: tenant.id });
    store.delete(tenant.id);
    const { error } = await run(middleware, `Bearer ${token}`);
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("attaches the tenant to the request on success", async () => {
    const { middleware, tenant } = setup();
    const token = tokens.sign({ tenantId: tenant.id });
    const { req, error, called } = await run(middleware, `Bearer ${token}`);
    expect(called).toBe(true);
    expect(error).toBeUndefined();
    expect(req.tenantId).toBe(tenant.id);
    expect(req.tenant).toBe(tenant);
    expect(getTenantId(req)).toBe(tenant.id);
  });

  it("getTenantId throws when no tenant is attached", () => {
    expect(() => getTenantId({} as Request)).toThrow(UnauthorizedError);
  });
});
