import { Router } from "express";
import { TenantController } from "../../domain/tenant/infrastructure/http/tenant.controller";
import { CreateTenantUseCase } from "../../domain/tenant/application/use-cases/create-tenant.use-case";
import { TenantRepository } from "../../domain/tenant/infrastructure/persistence/tenant.repository";
import { ConsoleEventDispatcher } from "../shared/console-event-dispatcher";
import { createTenantRoutes } from "../../domain/tenant/infrastructure/http/tenant.routes";
import { db } from "../database/connection";
export function createRoutes(): Router {
  const router = Router();
  const consoleEventDispatcher = new ConsoleEventDispatcher();

  // --- Tenant domain ---
  const tenantRepository = new TenantRepository(db);
  const createTenantUsecase = new CreateTenantUseCase(
    tenantRepository,
    consoleEventDispatcher,
  );
  const tenantController = new TenantController(createTenantUsecase);
  router.use("/tenants", createTenantRoutes(tenantController));

  return router;
}
