import { AppError } from "./base-error";

export class ConflictError extends AppError {
  statusCode = 409;
  code = "CONFLICT";
}
