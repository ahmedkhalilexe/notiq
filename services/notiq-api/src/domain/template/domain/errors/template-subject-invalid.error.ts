import { ValidationError } from "../../../shared/errors/validation-error";

export class TemplateSubjectInvalidError extends ValidationError {
  constructor() {
    super("Invalid subject");
    this.code = "TEMPLATE_SUBJECT_INVALID";
  }
}
