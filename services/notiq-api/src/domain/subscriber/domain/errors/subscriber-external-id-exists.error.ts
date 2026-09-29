import { ConflictError } from "../../../shared/errors/conflict-error";

export class SubscriberExternalIdExistsError extends ConflictError {
  constructor(message = "A subscriber with this external ID already exists for this tenant") {
    super(message);
    this.code = "SUBSCRIBER_EXTERNAL_ID_EXISTS";
  }
}
