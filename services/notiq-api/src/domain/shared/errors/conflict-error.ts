import { AppError } from "./base-error";

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = "CONFLICT";
}
