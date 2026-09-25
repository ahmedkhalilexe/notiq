import { Template } from "../../domain/entities/template.entity";
import { TemplateBody } from "../../domain/value-objects/template-body.vo";
import { TemplateChannel } from "../../domain/value-objects/template-channel.vo";
import { TemplateVariable } from "../../domain/value-objects/template-variable.vo";

export interface TemplatePersistence {
  id: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables?: { key: string; required: boolean }[];
  created_at: Date;
  deleted_at: Date | null;
}

export interface TemplateResponseDTO {
  id: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables: { key: string; required: boolean }[];
  created_at: Date;
  deleted_at: Date | null;
}

export class TemplateMapper {
  static toDomain(raw: TemplatePersistence): Template {
    const templateChannel = TemplateChannel.create(raw.channel);
    const templateBody = TemplateBody.create(raw.body);
    const templateVariables = (raw.variables ?? []).map((v) => {
      return TemplateVariable.create(v.key, v.required);
    });
    return Template.reconstitute(
      raw.id,
      raw.name,
      templateChannel,
      raw.subject,
      templateBody,
      templateVariables,
      new Date(raw.created_at),
      raw.deleted_at ? new Date(raw.deleted_at) : null,
    );
  }

  static toPersistence(template: Template) {
    return {
      id: template.id,
      name: template.name,
      channel: template.channel.value,
      subject: template.subject,
      body: template.body.value,
      created_at: template.createdAt,
      deleted_at: template.deletedAt,
    };
  }

  static toResponse(template: Template): TemplateResponseDTO {
    return {
      id: template.id,
      name: template.name,
      channel: template.channel.value,
      subject: template.subject,
      body: template.body.value,
      variables: template.getVariables().map((v) => ({
        key: v.key,
        required: v.required,
      })),
      created_at: template.createdAt,
      deleted_at: template.deletedAt,
    };
  }
}
