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

import { SubscriberRepository } from "../../domain/subscriber/infrastructure/persistence/subscriber.repository";
import { CreateSubscriberUseCase } from "../../domain/subscriber/application/use-cases/create-subscriber.use-case";
import { GetSubscriberUseCase } from "../../domain/subscriber/application/use-cases/get-subscriber.use-case";
import { UpdateSubscriberUseCase } from "../../domain/subscriber/application/use-cases/update-subscriber.use-case";
import { UpdateSubscriberPreferenceUseCase } from "../../domain/subscriber/application/use-cases/update-subscriber-preference.use-case";
import { DeleteSubscriberUseCase } from "../../domain/subscriber/application/use-cases/delete-subscriber.use-case";
import { ListSubscribersUseCase } from "../../domain/subscriber/application/use-cases/list-subscribers.use-case";
import { SubscriberController } from "../../domain/subscriber/infrastructure/http/subscriber.controller";
import { createSubscriberRoutes } from "../../domain/subscriber/infrastructure/http/subscriber.routes";

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

  // --- Subscriber domain ---
  const subscriberRepository = new SubscriberRepository(db);
  const createSubscriberUseCase = new CreateSubscriberUseCase(
    subscriberRepository,
    consoleEventDispatcher,
  );
  const getSubscriberUseCase = new GetSubscriberUseCase(subscriberRepository);
  const updateSubscriberUseCase = new UpdateSubscriberUseCase(
    subscriberRepository,
    consoleEventDispatcher,
  );
  const updateSubscriberPreferenceUseCase =
    new UpdateSubscriberPreferenceUseCase(
      subscriberRepository,
      consoleEventDispatcher,
    );
  const deleteSubscriberUseCase = new DeleteSubscriberUseCase(
    subscriberRepository,
    consoleEventDispatcher,
  );
  const listSubscribersUseCase = new ListSubscribersUseCase(
    subscriberRepository,
  );
  const subscriberController = new SubscriberController(
    createSubscriberUseCase,
    getSubscriberUseCase,
    updateSubscriberUseCase,
    updateSubscriberPreferenceUseCase,
    deleteSubscriberUseCase,
    listSubscribersUseCase,
  );
  router.use("/subscribers", createSubscriberRoutes(subscriberController));

  return router;
}
