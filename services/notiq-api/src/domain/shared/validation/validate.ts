import type Joi from "joi";
import { ValidationError } from "../errors/validation-error";

export function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): T {
  const { value, error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    throw new ValidationError(message);
  }

  return value;
}
