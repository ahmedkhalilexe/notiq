import { describe, expect, it } from "bun:test";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../domain/shared/errors/unauthorized-error";
import { TokenService } from "./token.service";

const SECRET = "a".repeat(32);
const TENANT_ID = "11111111-1111-4111-8111-111111111111";

describe("TokenService", () => {
  const service = new TokenService({ secret: SECRET, expiresIn: "1h" });

  it("rejects a missing or short secret", () => {
    expect(() => new TokenService({ secret: "", expiresIn: "1h" })).toThrow();
    expect(
      () => new TokenService({ secret: "short", expiresIn: "1h" }),
    ).toThrow();
  });

  it("signs and verifies a token round trip", () => {
    const token = service.sign({ tenantId: TENANT_ID });
    expect(service.verify(token)).toEqual({ tenantId: TENANT_ID });
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({}, SECRET, {
      algorithm: "HS256",
      subject: TENANT_ID,
      expiresIn: -10,
    });
    expect(() => service.verify(expired)).toThrow(UnauthorizedError);
  });

  it("rejects a token signed with another secret", () => {
    const other = new TokenService({ secret: "b".repeat(32), expiresIn: "1h" });
    const token = other.sign({ tenantId: TENANT_ID });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it("rejects a tampered token", () => {
    const [h, , s] = service.sign({ tenantId: TENANT_ID }).split(".");
    const payload = Buffer.from(
      JSON.stringify({ sub: "other-tenant" }),
    ).toString("base64url");
    expect(() => service.verify(`${h}.${payload}.${s}`)).toThrow(
      UnauthorizedError,
    );
  });

  it("rejects alg=none tokens", () => {
    const token = jwt.sign({}, "", { algorithm: "none", subject: TENANT_ID });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it("rejects a token without a subject", () => {
    const token = jwt.sign({}, SECRET, { algorithm: "HS256" });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });

  it("rejects a token signed with a different algorithm", () => {
    const token = jwt.sign({}, SECRET, {
      algorithm: "HS512",
      subject: TENANT_ID,
    });
    expect(() => service.verify(token)).toThrow(UnauthorizedError);
  });
});
