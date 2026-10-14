import type { IEventDispatcher } from "../../../shared/ports";
import { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import { TemplateBody } from "../../domain/value-objects/template-body.vo";
import { TemplateChannel } from "../../domain/value-objects/template-channel.vo";
import { TemplateVariable } from "../../domain/value-objects/template-variable.vo";
import type { CreateTemplateDTO } from "../dtos/create-template.dto";

export class CreateTemplateUsecase {
  public constructor(
    private readonly templateRepository: ITemplateRepository,
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  public async execute(dto: CreateTemplateDTO): Promise<Template> {
    const templateBody = TemplateBody.create(dto.body);
    const templateChannel = TemplateChannel.create(dto.channel);

    let variables: TemplateVariable[] = [];
    if (dto.variables && dto.variables.length > 0) {
      variables = dto.variables.map((v) =>
        TemplateVariable.create(v.key, v.required ?? false),
      );
    } else {
      const extractedKeys = templateBody.extractVariables();
      variables = extractedKeys.map((key) =>
        TemplateVariable.create(key, false),
      );
    }

    const template = Template.create(
      dto.name,
      templateChannel,
      dto.subject,
      templateBody,
      variables,
    );

    await this.templateRepository.save(template);

    await this.eventDispatcher.dispatch(template.events);
    template.clearEvents();

    return template;
  }
}
