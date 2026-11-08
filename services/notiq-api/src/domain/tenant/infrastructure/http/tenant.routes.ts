import { type RequestHandler, Router } from "express";
import { asyncHandler } from "../../../../infra/http/middleware/async-handler";
import type { TenantController } from "./tenant.controller";

export function createTenantRoutes(
  controller: TenantController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  // Public until signup exists.
  router.post(
    "/",
    asyncHandler((req, res) => controller.create(req, res)),
  );

  router.get(
    "/me",
    authenticate,
    asyncHandler((req, res) => controller.me(req, res)),
  );

  router.delete(
    "/me",
    authenticate,
    asyncHandler((req, res) => controller.deleteMe(req, res)),
  );

  return router;
}
