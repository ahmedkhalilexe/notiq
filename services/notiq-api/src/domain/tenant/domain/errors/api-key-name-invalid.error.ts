import { ValidationError } from "../../../shared/errors/validation-error";

export class ApiKeyNameInvalidError extends ValidationError {
  constructor(message: string = "Api key name must be between 1 and 255 characters") {
    super(message);
    this.code = "API_KEY_NAME_INVALID";
  }
}
