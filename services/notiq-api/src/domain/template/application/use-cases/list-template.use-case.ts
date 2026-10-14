import type { IEventDispatcher } from "../../../shared/ports";
import { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import type { ListTemplateDTO } from "../dtos/list-template.dto";

export class ListTemplateUsecase {
  public constructor(
    private readonly templateRepository: ITemplateRepository,
    private readonly eventDispatcher?: IEventDispatcher,
  ) {}

  public async execute(dto: ListTemplateDTO): Promise<Template[]> {
    const templates = await this.templateRepository.list(
      dto.page,
      dto.limit,
      dto.channel,
    );

    if (this.eventDispatcher) {
      for (const t of templates) {
        await this.eventDispatcher.dispatch(t.events);
        t.clearEvents();
      }
    }

    return templates;
  }
}

// Backwards-compatible alias for previous typo
export const ListemplateUsecase = ListTemplateUsecase;
