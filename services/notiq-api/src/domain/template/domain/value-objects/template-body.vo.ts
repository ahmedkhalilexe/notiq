import { TemplateBodyInvalidError } from "../errors/template-body-invalid.error";

export class TemplateBody {
  private constructor(public readonly value: string) {}

  static create(value: string): TemplateBody {
    if (value.trim().length === 0) {
      throw new TemplateBodyInvalidError();
    }
    return new TemplateBody(value);
  }

  extractVariables(): string[] {
    const matches = this.value.match(/\{\{(\w+)\}\}/g);
    // A placeholder may be used several times; it is still one variable.
    return matches ? [...new Set(matches.map((m) => m.slice(2, -2)))] : [];
  }

  render(variables: Record<string, string>): string {
    return this.value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] ?? `{{${key}}}`;
    });
  }
}
