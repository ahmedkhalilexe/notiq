import { TemplateVariableKeyInvalidError } from "../errors/template-variable-invalid-key.error";

export class TemplateVariable {
  private static readonly MAX_KEY_LENGTH = 64;

  private constructor(
    readonly key: string,
    readonly required: boolean,
  ) {}

  static create(key: string, required: boolean): TemplateVariable {
    if (!key) throw new TemplateVariableKeyInvalidError();
    if (key.trim().length === 0 || key.length > this.MAX_KEY_LENGTH)
      throw new TemplateVariableKeyInvalidError();
    if (key.includes("__") || key.endsWith("_"))
      throw new TemplateVariableKeyInvalidError();
    return new TemplateVariable(key, required);
  }
}
