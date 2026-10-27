import { UnauthorizedError } from "../../../shared/errors/unauthorized-error";

export class ApiKeyRevokedError extends UnauthorizedError {
  constructor(message: string = "Api key has been revoked") {
    super(message);
    this.code = "API_KEY_REVOKED";
  }
}
