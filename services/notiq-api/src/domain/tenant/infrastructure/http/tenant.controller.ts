import type { Request, Response } from "express";
import type { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import {
  createTenantSchema,
  deleteTenantSchema,
  findByIdTenantSchema,
} from "./tenant.validator";
import type { CreateTenantDTO } from "../../application/dtos/create-tenant.dto";
import { validate } from "../../../shared/validation/validate";
import type { FindByIdTenantUsecase } from "../../application/use-cases/get-tenant.use-case";
import type { ListTenantUsecase } from "../../application/use-cases/list-tenant.use-case";
import type { DeleteTenantUsecase } from "../../application/use-cases/delete-tenant.use-case";

export class TenantController {
  public constructor(
    private readonly createTenantUsecase: CreateTenantUseCase,
    private readonly findByIdTenantUsecase: FindByIdTenantUsecase,
    private readonly listTenantUsecase: ListTenantUsecase,
    private readonly deleteTenantUsecase: DeleteTenantUsecase,
  ) {}
  public async create(req: Request, res: Response): Promise<void> {
    const value = validate(createTenantSchema, req.body);

    const tenant = await this.createTenantUsecase.execute(
      value as CreateTenantDTO,
    );

    res.status(201).json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        api_key: tenant.apiKey.value,
        created_at: tenant.createdAt,
      },
      message: "tenant created succesfully",
    });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const value = validate(deleteTenantSchema, req.params);

    await this.deleteTenantUsecase.execute(value.id);

    res.status(204).send();
  }

  public async findById(req: Request, res: Response): Promise<void> {
    const value = validate(findByIdTenantSchema, req.params);

    const tenant = await this.findByIdTenantUsecase.execute(value);

    res.status(201).json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        api_key: tenant.apiKey.value,
        created_at: tenant.createdAt,
      },
      message: "tenant retreived succesfully",
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const tenants = await this.listTenantUsecase.execute({ page, limit });

    res.status(201).json({
      tenants: tenants.map((tenant) => {
        return {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          api_key: tenant.apiKey.value,
          created_at: tenant.createdAt,
          deletedAt: tenant.deletedAt,
        };
      }),
      message: "tenants retreived succesfully",
    });
  }
}
