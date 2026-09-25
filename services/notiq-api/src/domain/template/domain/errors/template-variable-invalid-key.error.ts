import { ValidationError } from "../../../shared/errors/validation-error";

export class TemplateVariableKeyInvalidError extends ValidationError {
  constructor() {
    super("Invalid variable key");
    this.code = "TEMPLATE_VARIABLE_KEY_INVALID";
  }
}
