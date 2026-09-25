import { Router } from "express";
import type { TemplateController } from "./template.controller";
import { asyncHandler } from "../../../../infra/http/middleware/async-handler";

export function createTemplateRoutes(controller: TemplateController): Router {
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

  router.patch(
    "/:id",
    asyncHandler((req, res) => controller.update(req, res)),
  );

  router.delete(
    "/:id",
    asyncHandler((req, res) => controller.delete(req, res)),
  );

  return router;
}
