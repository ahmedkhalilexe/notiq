import { AppError } from "./base-error";

export class UnauthorizedError extends AppError {
  statusCode = 401;
  code = "UNAUTHORIZED";

  constructor(message: string = "Unauthorized") {
    super(message);
  }
}
