export class TemplateChannel {
  private static readonly ALLOWED = ["email", "sms", "in-app"] as const;

  public constructor(public readonly value: string) {}

  static create(value: string): TemplateChannel {
    const normalized = value.toLowerCase().trim();
    if (!TemplateChannel.ALLOWED.includes(normalized as any)) {
      throw new Error(
        `Invalid channel: ${value}. Allowed: ${TemplateChannel.ALLOWED.join(", ")}`,
      );
    }
    return new TemplateChannel(normalized);
  }

  static email(): TemplateChannel {
    return new TemplateChannel("email");
  }
  static sms(): TemplateChannel {
    return new TemplateChannel("sms");
  }
  static inApp(): TemplateChannel {
    return new TemplateChannel("in-app");
  }
}
