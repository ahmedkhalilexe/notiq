import { NotFoundError } from "../../../shared/errors/not-found-error";
import { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import type { FindByIDTemplateDTO } from "../dtos/find-by-id-template.dto";

export class GetTemplateUsecase {
  public constructor(
    private readonly templateRepository: ITemplateRepository,
  ) {}

  public async execute(dto: FindByIDTemplateDTO): Promise<Template> {
    const template = await this.templateRepository.findById(dto.id);

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    return template;
  }
}
