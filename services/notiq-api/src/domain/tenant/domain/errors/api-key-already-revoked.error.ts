import { ConflictError } from "../../../shared/errors/conflict-error";

export class ApiKeyAlreadyRevokedError extends ConflictError {
  constructor() {
    super("Api key is already revoked");
    this.code = "API_KEY_ALREADY_REVOKED";
  }
}
