import { AppError } from "./base-error";

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND_ERROR";
}
