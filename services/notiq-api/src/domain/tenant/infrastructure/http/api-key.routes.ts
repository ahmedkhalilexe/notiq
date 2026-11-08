import { Router } from "express";
import { asyncHandler } from "../../../../infra/http/middleware/async-handler";
import type { ApiKeyController } from "./api-key.controller";

export function createApiKeyRoutes(controller: ApiKeyController): Router {
  const router = Router();

  router.post(
    "/",
    asyncHandler((req, res) => controller.create(req, res)),
  );

  router.get(
    "/",
    asyncHandler((req, res) => controller.list(req, res)),
  );

  router.delete(
    "/:keyId",
    asyncHandler((req, res) => controller.revoke(req, res)),
  );

  return router;
}
