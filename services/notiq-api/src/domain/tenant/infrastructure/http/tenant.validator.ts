import Joi from "joi";

export const createTenantSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      "string.min": "Tenant name must be at least 2 characters",
      "string.max": "Tenant name cannot exceed 100 characters",
      "string.pattern.base": "Tenant name contains invalid characters",
      "string.empty": "Tenant name is required",
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .max(255)
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.max": "Email cannot exceed 255 characters",
      "string.empty": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    )
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number and special character",
      "string.empty": "Password is required",
    }),
});

export const findByIdTenantSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "ID is required",
    "string.guid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});
