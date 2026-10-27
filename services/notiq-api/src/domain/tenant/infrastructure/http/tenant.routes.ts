import { Router } from "express";
import type { TenantController } from "./tenant.controller";
import type { ApiKeyController } from "./api-key.controller";
import { asyncHandler } from "../../../../infra/http/middleware/async-handler";

export function createTenantRoutes(
  controller: TenantController,
  apiKeyController?: ApiKeyController,
): Router {
  const router = Router();

  router.post(
    "/",
    asyncHandler((req, res) => controller.create(req, res)),
  );

  router.get(
    "/",
    asyncHandler((req, res) => controller.list(req, res)),
  );

  router.get(
    "/:id",
    asyncHandler((req, res) => controller.findById(req, res)),
  );

  router.delete(
    "/:id",
    asyncHandler((req, res) => controller.delete(req, res)),
  );

  if (apiKeyController) {
    router.post(
      "/:id/api-keys",
      asyncHandler((req, res) => apiKeyController.create(req, res)),
    );

    router.get(
      "/:id/api-keys",
      asyncHandler((req, res) => apiKeyController.list(req, res)),
    );

    router.delete(
      "/:id/api-keys/:keyId",
      asyncHandler((req, res) => apiKeyController.revoke(req, res)),
    );
  }

  return router;
}
