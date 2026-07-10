import { Router } from "express";
import type { TenantController } from "./tenant.controller";
import { asyncHandler } from "../../../../infra/http/middleware/async-handler";

export function createTenantRoutes(controller: TenantController): Router {
  const router = Router();

  router.post(
    "/",
    asyncHandler((req, res) => controller.create(req, res)),
  );

  return router;
}
