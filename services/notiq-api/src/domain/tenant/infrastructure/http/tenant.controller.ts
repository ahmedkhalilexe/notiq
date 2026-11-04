import type { Request, Response } from "express";
import type { CreateTenantUseCase } from "../../application/use-cases/create-tenant.use-case";
import { createTenantSchema } from "./tenant.validator";
import type { CreateTenantDTO } from "../../application/dtos/create-tenant.dto";
import { validate } from "../../../shared/validation/validate";
import type { FindByIdTenantUsecase } from "../../application/use-cases/get-tenant.use-case";
import type { DeleteTenantUsecase } from "../../application/use-cases/delete-tenant.use-case";
import { getTenantId } from "../../../../infra/http/middleware/jwt-auth";
import { TenantMapper } from "../mappers/tenant.mapper";

export class TenantController {
  public constructor(
    private readonly createTenantUsecase: CreateTenantUseCase,
    private readonly findByIdTenantUsecase: FindByIdTenantUsecase,
    private readonly deleteTenantUsecase: DeleteTenantUsecase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    const value = validate(createTenantSchema, req.body);

    const tenant = await this.createTenantUsecase.execute(
      value as CreateTenantDTO,
    );

    res.status(201).json({
      tenant: TenantMapper.toResponse(tenant),
      message: "tenant created successfully",
    });
  }

  public async deleteMe(req: Request, res: Response): Promise<void> {
    await this.deleteTenantUsecase.execute(getTenantId(req));

    res.status(204).send();
  }

  public async me(req: Request, res: Response): Promise<void> {
    const tenant = await this.findByIdTenantUsecase.execute({
      id: getTenantId(req),
    });

    res.status(200).json({
      tenant: TenantMapper.toResponse(tenant),
      message: "tenant retrieved successfully",
    });
  }
}
