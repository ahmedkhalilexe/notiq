import { ValidationError } from "../../../shared/errors/validation-error";

export class TemplateNameInvalidError extends ValidationError {
  constructor() {
    super("Invalid name");
    this.code = "TEMPLATE_NAME_INVALID";
  }
}
