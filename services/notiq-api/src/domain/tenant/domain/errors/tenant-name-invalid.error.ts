import { ValidationError } from "../../../shared/errors/validation-error";

export class TenantNameInvalidError extends ValidationError {
  constructor() {
    super("Tenant name must be between 2 and 100 characters");
    this.code = "TENANT_NAME_INVALID";
  }
}
