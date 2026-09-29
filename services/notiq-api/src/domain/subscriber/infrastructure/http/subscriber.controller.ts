import type { Request, Response } from "express";
import { validate } from "../../../shared/validation/validate";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { CreateSubscriberUseCase } from "../../application/use-cases/create-subscriber.use-case";
import type { GetSubscriberUseCase } from "../../application/use-cases/get-subscriber.use-case";
import type { UpdateSubscriberUseCase } from "../../application/use-cases/update-subscriber.use-case";
import type { UpdateSubscriberPreferenceUseCase } from "../../application/use-cases/update-subscriber-preference.use-case";
import type { DeleteSubscriberUseCase } from "../../application/use-cases/delete-subscriber.use-case";
import type { ListSubscribersUseCase } from "../../application/use-cases/list-subscribers.use-case";
import {
  createSubscriberSchema,
  updateSubscriberSchema,
  updatePreferenceSchema,
  findSubscriberParamSchema,
  listSubscribersQuerySchema,
} from "./subscriber.validator";
import { SubscriberMapper } from "../mappers/subscriber.mapper";

export class SubscriberController {
  public constructor(
    private readonly createSubscriberUseCase: CreateSubscriberUseCase,
    private readonly getSubscriberUseCase: GetSubscriberUseCase,
    private readonly updateSubscriberUseCase: UpdateSubscriberUseCase,
    private readonly updateSubscriberPreferenceUseCase: UpdateSubscriberPreferenceUseCase,
    private readonly deleteSubscriberUseCase: DeleteSubscriberUseCase,
    private readonly listSubscribersUseCase: ListSubscribersUseCase,
  ) {}

  private getTenantId(req: Request, requireTenant = true): string | undefined {
    const headerTenant = req.headers["x-tenant-id"] as string | undefined;
    const bodyTenant = req.body?.tenant_id || req.body?.tenantId;
    const queryTenant = (req.query?.tenant_id || req.query?.tenantId) as
      | string
      | undefined;

    const tenantId = headerTenant || bodyTenant || queryTenant;

    if (requireTenant && !tenantId) {
      throw new ValidationError(
        "tenant_id is required via x-tenant-id header or request body/query",
      );
    }

    return tenantId;
  }

  public async create(req: Request, res: Response): Promise<void> {
    const tenantId = this.getTenantId(req, true)!;
    const body = validate(createSubscriberSchema, req.body);

    const subscriber = await this.createSubscriberUseCase.execute({
      tenantId,
      externalId: body.external_id || body.externalId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      channels: body.channels,
    });

    res.status(201).json({
      subscriber: SubscriberMapper.toResponse(subscriber),
      message: "subscriber created successfully",
    });
  }

  public async findById(req: Request, res: Response): Promise<void> {
    const params = validate(findSubscriberParamSchema, req.params);
    const tenantId = this.getTenantId(req, false);

    const subscriber = await this.getSubscriberUseCase.execute({
      id: params.id,
      tenantId,
    });

    res.status(200).json({
      subscriber: SubscriberMapper.toResponse(subscriber),
      message: "subscriber retrieved successfully",
    });
  }

  public async update(req: Request, res: Response): Promise<void> {
    const params = validate(findSubscriberParamSchema, req.params);
    const body = validate(updateSubscriberSchema, req.body);
    const tenantId = this.getTenantId(req, false);

    const subscriber = await this.updateSubscriberUseCase.execute({
      id: params.id,
      tenantId,
      externalId: body.external_id || body.externalId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      channels: body.channels,
    });

    res.status(200).json({
      subscriber: SubscriberMapper.toResponse(subscriber),
      message: "subscriber updated successfully",
    });
  }

  public async updatePreference(req: Request, res: Response): Promise<void> {
    const params = validate(findSubscriberParamSchema, req.params);
    const body = validate(updatePreferenceSchema, req.body);
    const tenantId = this.getTenantId(req, false);

    const subscriber = await this.updateSubscriberPreferenceUseCase.execute({
      id: params.id,
      tenantId,
      channel: body.channel,
      enabled: body.enabled,
      value: body.value,
    });

    res.status(200).json({
      subscriber: SubscriberMapper.toResponse(subscriber),
      message: "subscriber preference updated successfully",
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const query = validate(listSubscribersQuerySchema, req.query);
    const tenantId = this.getTenantId(req, false);

    const subscribers = await this.listSubscribersUseCase.execute({
      tenantId,
      page: query.page,
      limit: query.limit,
      channel: query.channel,
      enabled: query.enabled,
    });

    res.status(200).json({
      subscribers: subscribers.map((s) => SubscriberMapper.toResponse(s)),
      page: query.page || 1,
      limit: query.limit || 10,
      message: "subscribers retrieved successfully",
    });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const params = validate(findSubscriberParamSchema, req.params);
    const tenantId = this.getTenantId(req, false);

    await this.deleteSubscriberUseCase.execute({
      id: params.id,
      tenantId,
    });

    res.status(204).send();
  }
}
