import { ConflictError } from "../../../shared/errors/conflict-error";

export class TenantEmailExistsError extends ConflictError {
  constructor() {
    super("A tenant with this email already exists");
    this.code = "TENANT_EMAIL_EXISTS";
  }
}
