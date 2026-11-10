import type Joi from "joi";
import { ValidationError } from "../errors/validation-error";

export function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  // A request without a body leaves req.body undefined; treat it as empty so
  // the schema reports the missing fields instead of passing undefined on.
  const { value, error } = schema.validate(data ?? {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    throw new ValidationError(message);
  }

  return value;
}
