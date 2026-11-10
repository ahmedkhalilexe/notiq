import { describe, expect, it } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { ConflictError } from "../../../domain/shared/errors/conflict-error";
import { ValidationError } from "../../../domain/shared/errors/validation-error";
import { validate } from "../../../domain/shared/validation/validate";
import { loginSchema } from "../../../domain/tenant/infrastructure/http/auth.validator";
import { ErrorHandler, NotFoundHandler } from "./error-handler";

function mockRes(headersSent = false) {
  const res = {
    headersSent,
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function handle(err: unknown, headersSent = false) {
  const res = mockRes(headersSent);
  let forwarded: unknown;
  const next: NextFunction = (e?: unknown) => {
    forwarded = e;
  };
  // Keep expected-error logging out of the test output.
  const { warn, error } = console;
  console.warn = () => {};
  console.error = () => {};
  try {
    ErrorHandler(err as Error, {} as Request, res as unknown as Response, next);
  } finally {
    console.warn = warn;
    console.error = error;
  }
  return { res, forwarded };
}

describe("ErrorHandler", () => {
  it("maps AppError subclasses to their status and code", () => {
    const { res } = handle(new ConflictError("taken"));
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      status: "error",
      code: "CONFLICT",
      message: "taken",
    });
  });

  it("maps malformed JSON to 400", () => {
    const err = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    const { res } = handle(err);
    expect(res.statusCode).toBe(400);
    expect((res.body as { code: string }).code).toBe("INVALID_JSON");
  });

  it("maps an oversized body to 413", () => {
    const err = Object.assign(new Error("request entity too large"), {
      type: "entity.too.large",
      status: 413,
    });
    const { res } = handle(err);
    expect(res.statusCode).toBe(413);
    expect((res.body as { code: string }).code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("maps a Postgres unique violation to 409 without leaking SQL", () => {
    const err = Object.assign(
      new Error('insert into "tenants" ... duplicate key value'),
      { code: "23505" },
    );
    const { res } = handle(err);
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      status: "error",
      code: "CONFLICT",
      message: "Resource already exists",
    });
  });

  it("hides unexpected errors behind a generic 500", () => {
    const { res } = handle(new Error("secret internals"));
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("secret internals");
  });

  it("delegates to Express when the response has already started", () => {
    const err = new Error("late");
    const { res, forwarded } = handle(err, true);
    expect(forwarded).toBe(err);
    expect(res.statusCode).toBe(0);
  });
});

describe("NotFoundHandler", () => {
  it("answers unknown routes with JSON", () => {
    const res = mockRes();
    NotFoundHandler(
      { method: "GET", path: "/v1/api/nope" } as Request,
      res as unknown as Response,
    );
    expect(res.statusCode).toBe(404);
    expect((res.body as { code: string }).code).toBe("ROUTE_NOT_FOUND");
  });
});

describe("validate", () => {
  it("treats a missing body as empty and reports required fields", () => {
    expect(() => validate(loginSchema, undefined)).toThrow(ValidationError);
  });
});
