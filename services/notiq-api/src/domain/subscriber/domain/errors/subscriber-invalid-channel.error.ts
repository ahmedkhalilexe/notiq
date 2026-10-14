import { ValidationError } from "../../../shared/errors/validation-error";

export class SubscriberInvalidChannelError extends ValidationError {
  constructor(channel: string) {
    super(`Invalid channel: ${channel}. Allowed channels: email, sms, in_app`);
    this.code = "SUBSCRIBER_INVALID_CHANNEL";
  }
}
