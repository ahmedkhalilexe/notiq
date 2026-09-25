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

import { TemplateRepository } from "../../domain/template/infrastructure/persistence/template.repository";
import { CreateTemplateUsecase } from "../../domain/template/application/use-cases/create-template.use-case";
import { UpdateTemplateUsecase } from "../../domain/template/application/use-cases/update-template.use-case";
import { GetTemplateUsecase } from "../../domain/template/application/use-cases/get-template.use-case";
import { ListTemplateUsecase } from "../../domain/template/application/use-cases/list-template.use-case";
import { DeleteTemplateUsecase } from "../../domain/template/application/use-cases/delete-template.use-case";
import { TemplateController } from "../../domain/template/infrastructure/http/template.controller";
import { createTemplateRoutes } from "../../domain/template/infrastructure/http/template.routes";

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

  // --- Template domain ---
  const templateRepository = new TemplateRepository(db);
  const createTemplateUsecase = new CreateTemplateUsecase(
    templateRepository,
    consoleEventDispatcher,
  );
  const updateTemplateUsecase = new UpdateTemplateUsecase(
    templateRepository,
    consoleEventDispatcher,
  );
  const getTemplateUsecase = new GetTemplateUsecase(templateRepository);
  const listTemplateUsecase = new ListTemplateUsecase(
    templateRepository,
    consoleEventDispatcher,
  );
  const deleteTemplateUsecase = new DeleteTemplateUsecase(
    templateRepository,
    consoleEventDispatcher,
  );
  const templateController = new TemplateController(
    createTemplateUsecase,
    updateTemplateUsecase,
    getTemplateUsecase,
    listTemplateUsecase,
    deleteTemplateUsecase,
  );
  router.use("/templates", createTemplateRoutes(templateController));

  return router;
}
