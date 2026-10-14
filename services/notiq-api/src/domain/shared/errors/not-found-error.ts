import { AppError } from "./base-error";

export class NotFoundError extends AppError {
  statusCode = 404;
  code = "NOT_FOUND_ERROR";
}
