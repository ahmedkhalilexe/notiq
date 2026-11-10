import Joi from "joi";

// Deliberately loose: login must not reveal the password policy, and any
// policy change must not lock out tenants whose password predates it.
export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().max(255).required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().max(128).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});
