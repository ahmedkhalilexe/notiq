import { ValidationError } from "../../../shared/errors/validation-error";

export class TenantEmailInvalidError extends ValidationError {
  constructor() {
    super("Invalid email address");
    this.code = "TENANT_EMAIL_INVALID";
  }
}
