import { UnauthorizedError } from "../../../shared/errors/unauthorized-error";

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password");
    this.code = "INVALID_CREDENTIALS";
  }
}
