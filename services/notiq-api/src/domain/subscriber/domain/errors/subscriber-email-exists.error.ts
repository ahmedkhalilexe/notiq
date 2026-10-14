import { ConflictError } from "../../../shared/errors/conflict-error";

export class SubscriberEmailExistsError extends ConflictError {
  constructor(message = "A subscriber with this email already exists for this tenant") {
    super(message);
    this.code = "SUBSCRIBER_EMAIL_EXISTS";
  }
}
