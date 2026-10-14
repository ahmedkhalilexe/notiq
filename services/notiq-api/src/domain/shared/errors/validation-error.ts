import { AppError } from "./base-error";

export class ValidationError extends AppError {
  statusCode = 400;
  code = "VALIDATION_ERROR";
}
