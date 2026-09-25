import { ConflictError } from "../../../shared/errors/conflict-error";

export class TemplateVariableExistsError extends ConflictError {
  constructor() {
    super(`A template variable with this key already exists`);
    this.code = "TEMPLATE_VARIABLE_EXISTS";
  }
}
