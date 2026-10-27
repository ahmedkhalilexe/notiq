import { ValidationError } from "../../../shared/errors/validation-error";

export class TenantApiKeyInvalidError extends ValidationError {
  constructor() {
    super("Invalid api key");
    this.code = "TENANT_API_KEY_INVALID";
  }
}
