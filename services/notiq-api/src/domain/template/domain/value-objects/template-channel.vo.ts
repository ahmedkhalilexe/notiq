import { TemplateChannelInvalidError } from "../errors/template-channel-invalid.error";

export class TemplateChannel {
  private static readonly ALLOWED = ["email", "sms", "in_app"] as const;

  public constructor(public readonly value: string) {}

  static create(value: string): TemplateChannel {
    let normalized = value.toLowerCase().trim();
    if (normalized === "in-app") {
      normalized = "in_app";
    }

    if (!(TemplateChannel.ALLOWED as readonly string[]).includes(normalized)) {
      throw new TemplateChannelInvalidError(value, TemplateChannel.ALLOWED);
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
    return new TemplateChannel("in_app");
  }
}
