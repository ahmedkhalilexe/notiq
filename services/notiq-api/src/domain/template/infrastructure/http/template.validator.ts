import Joi from "joi";

export const createTemplateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Template name must be at least 2 characters",
    "string.max": "Template name cannot exceed 100 characters",
    "string.empty": "Template name is required",
    "any.required": "Template name is required",
  }),

  channel: Joi.string()
    .trim()
    .valid("email", "sms", "in-app")
    .required()
    .messages({
      "any.only": "Channel must be one of: email, sms, in-app",
      "string.empty": "Channel is required",
      "any.required": "Channel is required",
    }),

  subject: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Template subject must be at least 2 characters",
    "string.max": "Template subject cannot exceed 100 characters",
    "string.empty": "Template subject is required",
    "any.required": "Template subject is required",
  }),

  body: Joi.string().trim().min(1).required().messages({
    "string.empty": "Template body is required",
    "any.required": "Template body is required",
  }),

  variables: Joi.array()
    .items(
      Joi.object({
        key: Joi.string()
          .trim()
          .max(64)
          .pattern(/^[a-zA-Z0-9_-]+$/)
          .required()
          .messages({
            "string.pattern.base": "Variable key contains invalid characters",
            "string.empty": "Variable key cannot be empty",
            "any.required": "Variable key is required",
          }),
        required: Joi.boolean().default(false),
      }),
    )
    .optional(),
});

export const updateTemplateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Template name must be at least 2 characters",
    "string.max": "Template name cannot exceed 100 characters",
    "string.empty": "Template name cannot be empty",
  }),

  channel: Joi.string()
    .trim()
    .valid("email", "sms", "in-app")
    .optional()
    .messages({
      "any.only": "Channel must be one of: email, sms, in-app",
      "string.empty": "Channel cannot be empty",
    }),

  subject: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Template subject must be at least 2 characters",
    "string.max": "Template subject cannot exceed 100 characters",
    "string.empty": "Template subject cannot be empty",
  }),

  body: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Template body cannot be empty",
  }),

  variables: Joi.array()
    .items(
      Joi.object({
        key: Joi.string()
          .trim()
          .max(64)
          .pattern(/^[a-zA-Z0-9_-]+$/)
          .required()
          .messages({
            "string.pattern.base": "Variable key contains invalid characters",
            "string.empty": "Variable key cannot be empty",
            "any.required": "Variable key is required",
          }),
        required: Joi.boolean().default(false),
      }),
    )
    .optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to update",
  });

export const findByIdTemplateSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "ID is required",
    "string.guid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});

export const deleteTemplateSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "ID is required",
    "string.guid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});

export const listTemplateSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  channel: Joi.string().trim().valid("email", "sms", "in-app").optional(),
});
