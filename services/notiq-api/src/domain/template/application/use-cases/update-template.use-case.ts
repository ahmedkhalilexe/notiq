import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IEventDispatcher } from "../../../shared/ports";
import { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import { TemplateBody } from "../../domain/value-objects/template-body.vo";
import { TemplateChannel } from "../../domain/value-objects/template-channel.vo";
import { TemplateVariable } from "../../domain/value-objects/template-variable.vo";
import type { UpdateTemplateDTO } from "../dtos/update-template.dto";

export class UpdateTemplateUsecase {
  public constructor(
    private readonly templateRepository: ITemplateRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: UpdateTemplateDTO): Promise<Template> {
    const template = await this.templateRepository.findById(dto.id);

    if (!template) {
      throw new NotFoundError("Template doesn't exist");
    }

    const channel = dto.channel
      ? TemplateChannel.create(dto.channel)
      : undefined;
    const body = dto.body ? TemplateBody.create(dto.body) : undefined;
    const variables = dto.variables
      ? dto.variables.map((v) =>
          TemplateVariable.create(v.key, v.required ?? false),
        )
      : undefined;

    template.update({
      name: dto.name,
      channel,
      subject: dto.subject,
      body,
      variables,
    });

    await this.templateRepository.update(template);

    await this.eventDispatcher.dispatch(template.events);
    template.clearEvents();

    return template;
  }
}
