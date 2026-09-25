import type { Template } from "../entities/template.entity";

export interface ITemplateRepository {
  save(template: Template): Promise<void>;
  update(template: Template): Promise<void>;
  findById(id: string): Promise<Template | null>;
  list(page: number, limit: number, channel?: string): Promise<Template[]>;
}
