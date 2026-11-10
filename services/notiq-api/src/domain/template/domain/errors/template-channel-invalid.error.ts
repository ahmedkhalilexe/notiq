import { ValidationError } from "../../../shared/errors/validation-error";

export class TemplateChannelInvalidError extends ValidationError {
  constructor(channel: string, allowed: readonly string[]) {
    super(
      `Invalid channel: ${channel}. Allowed: ${allowed.join(", ")}, in-app`,
    );
    this.code = "TEMPLATE_CHANNEL_INVALID";
  }
}
