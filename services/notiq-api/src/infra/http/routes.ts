import { Router } from "express";
import { TenantController } from "../../domain/tenant/infrastructure/http/tenant.controller";
import { CreateTenantUseCase } from "../../domain/tenant/application/use-cases/create-tenant.use-case";
import { TenantRepository } from "../../domain/tenant/infrastructure/persistence/tenant.repository";
import { ConsoleEventDispatcher } from "../shared/console-event-dispatcher";
import { createTenantRoutes } from "../../domain/tenant/infrastructure/http/tenant.routes";
import { db } from "../database/connection";
import { FindByIdTenantUsecase } from "../../domain/tenant/application/use-cases/get-tenant.use-case";
import { ListTenantUsecase } from "../../domain/tenant/application/use-cases/list-tenant.use-case";
import { DeleteTenantUsecase } from "../../domain/tenant/application/use-cases/delete-tenant.use-case";
export function createRoutes(): Router {
  const router = Router();
  const consoleEventDispatcher = new ConsoleEventDispatcher();

  // --- Tenant domain ---
  const tenantRepository = new TenantRepository(db);
  const createTenantUsecase = new CreateTenantUseCase(
    tenantRepository,
    consoleEventDispatcher,
  );
  const findByIdTenantUsecase = new FindByIdTenantUsecase(tenantRepository);
  const listTenantUsecase = new ListTenantUsecase(tenantRepository);
  const deleteTenantUsecase = new DeleteTenantUsecase(
    tenantRepository,
    consoleEventDispatcher,
  );
  const tenantController = new TenantController(
    createTenantUsecase,
    findByIdTenantUsecase,
    listTenantUsecase,
    deleteTenantUsecase,
  );
  router.use("/tenants", createTenantRoutes(tenantController));

  return router;
}
