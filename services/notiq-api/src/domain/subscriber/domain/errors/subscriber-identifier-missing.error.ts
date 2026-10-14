import { ValidationError } from "../../../shared/errors/validation-error";

export class SubscriberIdentifierMissingError extends ValidationError {
  constructor(
    message = "Subscriber must have at least one identifier or contact method (email, phone, or external_id)",
  ) {
    super(message);
    this.code = "SUBSCRIBER_IDENTIFIER_MISSING";
  }
}
