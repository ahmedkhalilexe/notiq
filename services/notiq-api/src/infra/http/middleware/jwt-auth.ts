import type { NextFunction, Request, RequestHandler, Response } from "express";
import { UnauthorizedError } from "../../../domain/shared/errors/unauthorized-error";
import type { FindByIdTenantUsecase } from "../../../domain/tenant/application/use-cases/get-tenant.use-case";
import type { Tenant } from "../../../domain/tenant/domain/entities/tenant.entity";
import type { TokenService } from "../../auth/token.service";

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
      tenantId?: string;
    }
  }
}

const INVALID_MESSAGE = "Invalid or expired token";

export function createJwtAuth(
  tokenService: TokenService,
  findTenant: FindByIdTenantUsecase,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header) {
        throw new UnauthorizedError("Authorization header is required");
      }

      const [scheme, token, ...rest] = header.split(" ");
      if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
        throw new UnauthorizedError(INVALID_MESSAGE);
      }

      const { tenantId } = tokenService.verify(token);

      // Loading the tenant rejects tokens of deleted tenants immediately.
      let tenant: Tenant;
      try {
        tenant = await findTenant.execute({ id: tenantId });
      } catch {
        throw new UnauthorizedError(INVALID_MESSAGE);
      }

      req.tenant = tenant;
      req.tenantId = tenant.id;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Tenant id set by the JWT middleware.*/
export function getTenantId(req: Request): string {
  if (!req.tenantId) {
    throw new UnauthorizedError("Authentication required");
  }
  return req.tenantId;
}
