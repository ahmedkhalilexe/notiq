import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../../domain/shared/errors/not-found-error";
import type { GetTenantByApiKeyUseCase } from "../../../domain/tenant/application/use-cases/get-tenant-by-api-key.use-case";
import { ApiKeyRevokedError } from "../../../domain/tenant/domain/errors/api-key-revoked.error";
import { TenantApiKeyInvalidError } from "../../../domain/tenant/domain/errors/tenant-api-key-invalid.error";

export function createApiValidator(
  getTenantByApiKeyUseCase: GetTenantByApiKeyUseCase,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const apiHeader = req.headers["x-api-key"] || req.headers["X-API-KEY"];

    if (!apiHeader || typeof apiHeader !== "string") {
      res.status(401).json({
        status: "error",
        code: "UNAUTHORIZED",
        message: "API key is required in x-api-key header",
      });
      return;
    }

    try {
      const tenant = await getTenantByApiKeyUseCase.execute({
        apiKey: apiHeader.trim(),
      });

      req.tenant = tenant;
      req.tenantId = tenant.id;
      next();
    } catch (err: unknown) {
      if (
        err instanceof TenantApiKeyInvalidError ||
        err instanceof ApiKeyRevokedError ||
        err instanceof NotFoundError
      ) {
        res.status(401).json({
          status: "error",
          code: "UNAUTHORIZED",
          message: err.message || "Invalid or revoked API key",
        });
        return;
      }

      next(err);
    }
  };
}
