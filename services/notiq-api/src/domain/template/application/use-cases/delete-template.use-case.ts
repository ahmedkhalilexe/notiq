import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IEventDispatcher } from "../../../shared/ports";
import { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import type { DeleteTemplateDTO } from "../dtos/delete-template.dto";

export class DeleteTemplateUsecase {
  public constructor(
    private readonly templateRepository: ITemplateRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: DeleteTemplateDTO): Promise<Template> {
    const template = await this.templateRepository.findById(dto.id);

    if (!template) {
      throw new NotFoundError("Template doesn't exist");
    }

    template.delete();

    await this.templateRepository.update(template);

    await this.eventDispatcher.dispatch(template.events);
    template.clearEvents();

    return template;
  }
}
