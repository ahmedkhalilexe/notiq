import type { Request, Response } from "express";
import { validate } from "../../../shared/validation/validate";
import type { CreateTemplateUsecase } from "../../application/use-cases/create-template.use-case";
import type { UpdateTemplateUsecase } from "../../application/use-cases/update-template.use-case";
import type { GetTemplateUsecase } from "../../application/use-cases/get-template.use-case";
import type { ListTemplateUsecase } from "../../application/use-cases/list-template.use-case";
import type { DeleteTemplateUsecase } from "../../application/use-cases/delete-template.use-case";
import {
  createTemplateSchema,
  updateTemplateSchema,
  findByIdTemplateSchema,
  deleteTemplateSchema,
  listTemplateSchema,
} from "./template.validator";
import { TemplateMapper } from "../mappers/template.mapper";

export class TemplateController {
  public constructor(
    private readonly createTemplateUsecase: CreateTemplateUsecase,
    private readonly updateTemplateUsecase: UpdateTemplateUsecase,
    private readonly getTemplateUsecase: GetTemplateUsecase,
    private readonly listTemplateUsecase: ListTemplateUsecase,
    private readonly deleteTemplateUsecase: DeleteTemplateUsecase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    const value = validate(createTemplateSchema, req.body);
    const template = await this.createTemplateUsecase.execute(value);

    res.status(201).json({
      template: TemplateMapper.toResponse(template),
      message: "template created successfully",
    });
  }

  public async update(req: Request, res: Response): Promise<void> {
    const params = validate(findByIdTemplateSchema, req.params);
    const body = validate(updateTemplateSchema, req.body);

    const template = await this.updateTemplateUsecase.execute({
      id: params.id,
      ...body,
    });

    res.status(200).json({
      template: TemplateMapper.toResponse(template),
      message: "template updated successfully",
    });
  }

  public async findById(req: Request, res: Response): Promise<void> {
    const params = validate(findByIdTemplateSchema, req.params);
    const template = await this.getTemplateUsecase.execute({ id: params.id });

    res.status(200).json({
      template: TemplateMapper.toResponse(template),
      message: "template retrieved successfully",
    });
  }

  public async list(req: Request, res: Response): Promise<void> {
    const query = validate(listTemplateSchema, req.query);
    const templates = await this.listTemplateUsecase.execute({
      page: query.page,
      limit: query.limit,
      channel: query.channel,
    });

    res.status(200).json({
      templates: templates.map((t) => TemplateMapper.toResponse(t)),
      message: "templates retrieved successfully",
    });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const params = validate(deleteTemplateSchema, req.params);
    await this.deleteTemplateUsecase.execute({ id: params.id });

    res.status(204).send();
  }
}
