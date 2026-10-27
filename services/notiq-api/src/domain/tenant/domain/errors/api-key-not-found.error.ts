import { NotFoundError } from "../../../shared/errors/not-found-error";

export class ApiKeyNotFoundError extends NotFoundError {
  constructor(message: string = "Api key not found") {
    super(message);
    this.code = "API_KEY_NOT_FOUND";
  }
}
