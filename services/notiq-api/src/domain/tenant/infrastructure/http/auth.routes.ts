import { Router } from "express";
import { asyncHandler } from "../../../../infra/http/middleware/async-handler";
import type { AuthController } from "./auth.controller";

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post(
    "/login",
    asyncHandler((req, res) => controller.login(req, res)),
  );

  return router;
}
