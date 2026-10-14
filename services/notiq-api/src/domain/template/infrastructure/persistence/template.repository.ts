import type { DbConnection } from "../../../../infra/database/connection";
import type { Template } from "../../domain/entities/template.entity";
import type { ITemplateRepository } from "../../domain/repositories/template-repository.interface";
import { TemplateMapper } from "../mappers/template.mapper";

export class TemplateRepository implements ITemplateRepository {
  public constructor(private readonly db: DbConnection) {}

  async save(template: Template): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("templates").insert(TemplateMapper.toPersistence(template));

      const variables = template.getVariables();
      if (variables.length > 0) {
        await trx("template_variables").insert(
          variables.map((v) => ({
            id: crypto.randomUUID(),
            template_id: template.id,
            key: v.key,
            required: v.required,
            created_at: template.createdAt,
            updated_at: template.createdAt,
          })),
        );
      }
    });
  }

  async update(template: Template): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("templates")
        .where("id", template.id)
        .update(TemplateMapper.toPersistence(template));

      await trx("template_variables")
        .where("template_id", template.id)
        .delete();

      const variables = template.getVariables();
      if (variables.length > 0) {
        const now = new Date();
        await trx("template_variables").insert(
          variables.map((v) => ({
            id: crypto.randomUUID(),
            template_id: template.id,
            key: v.key,
            required: v.required,
            created_at: now,
            updated_at: now,
          })),
        );
      }
    });
  }

  async findById(id: string): Promise<Template | null> {
    const rawTemplate = await this.db("templates")
      .where("id", id)
      .whereNull("deleted_at")
      .first();

    if (!rawTemplate) return null;

    const rawVariables = await this.db("template_variables")
      .where("template_id", id)
      .select("key", "required");

    return TemplateMapper.toDomain({
      ...rawTemplate,
      variables: rawVariables,
    });
  }

  async list(
    page: number = 1,
    limit: number = 10,
    channel?: string,
  ): Promise<Template[]> {
    const offset = Math.max(0, (page - 1) * limit);

    let query = this.db("templates")
      .whereNull("deleted_at")
      .offset(offset)
      .limit(limit)
      .orderBy("created_at", "desc");

    if (channel) {
      query = query.where("channel", channel);
    }

    const rawTemplates = await query;
    if (rawTemplates.length === 0) return [];

    const templateIds = rawTemplates.map((t) => t.id);
    const rawVariables = await this.db("template_variables")
      .whereIn("template_id", templateIds)
      .select("template_id", "key", "required");

    const variablesMap = new Map<
      string,
      { key: string; required: boolean }[]
    >();
    for (const v of rawVariables) {
      if (!variablesMap.has(v.template_id)) {
        variablesMap.set(v.template_id, []);
      }
      variablesMap.get(v.template_id)!.push({
        key: v.key,
        required: v.required,
      });
    }

    return rawTemplates.map((raw) =>
      TemplateMapper.toDomain({
        ...raw,
        variables: variablesMap.get(raw.id) || [],
      }),
    );
  }
}
