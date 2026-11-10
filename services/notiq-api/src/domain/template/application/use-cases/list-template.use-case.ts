import type { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import type { ListTemplateDTO } from "../dtos/list-template.dto";

export class ListTemplateUsecase {
  public constructor(
    private readonly templateRepository: ITemplateRepository,
  ) {}

  public async execute(dto: ListTemplateDTO): Promise<Template[]> {
    return this.templateRepository.list(
      dto.tenantId,
      dto.page,
      dto.limit,
      dto.channel,
    );
  }
}
