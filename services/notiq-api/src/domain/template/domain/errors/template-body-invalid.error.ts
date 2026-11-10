import { ValidationError } from "../../../shared/errors/validation-error";

export class TemplateBodyInvalidError extends ValidationError {
  constructor() {
    super("Template body cannot be empty");
    this.code = "TEMPLATE_BODY_INVALID";
  }
}
