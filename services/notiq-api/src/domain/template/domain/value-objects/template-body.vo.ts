export class TemplateBody {
  private constructor(public readonly value: string) {}

  static create(value: string): TemplateBody {
    if (value.trim().length === 0) {
      throw new Error("Template body cannot be empty");
    }
    return new TemplateBody(value);
  }

  extractVariables(): string[] {
    const matches = this.value.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map((m) => m.slice(2, -2)) : [];
  }

  render(variables: Record<string, string>): string {
    return this.value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] ?? `{{${key}}}`;
    });
  }
}
