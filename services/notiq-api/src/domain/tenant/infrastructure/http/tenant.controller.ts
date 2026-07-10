import type { Request, Response } from "express";
import type { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import { createTenantSchema } from "./tenant.validator";
import type { CreateTenantDTO } from "../../application/dtos/create-tenant.dto";
import { validate } from "../../../shared/validation/validate";

export class TenantController {
  public constructor(
    private readonly createTenantUsecase: CreateTenantUseCase,
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
}
