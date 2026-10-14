import { NotFoundError } from "../../../shared/errors/not-found-error";

export class SubscriberNotFoundError extends NotFoundError {
  constructor(message = "Subscriber not found") {
    super(message);
    this.code = "SUBSCRIBER_NOT_FOUND";
  }
}
