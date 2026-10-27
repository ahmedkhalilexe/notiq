import Joi from "joi";

export const createApiKeyBodySchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required().messages({
    "string.min": "API key name must be at least 1 character",
    "string.max": "API key name cannot exceed 255 characters",
    "string.empty": "API key name is required",
    "any.required": "API key name is required",
  }),
});

export const tenantIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "Tenant ID is required",
    "string.guid": "Tenant ID must be a valid UUID",
    "any.required": "Tenant ID is required",
  }),
});

export const revokeApiKeyParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "Tenant ID is required",
    "string.guid": "Tenant ID must be a valid UUID",
    "any.required": "Tenant ID is required",
  }),
  keyId: Joi.string().uuid().required().messages({
    "string.empty": "Key ID is required",
    "string.guid": "Key ID must be a valid UUID",
    "any.required": "Key ID is required",
  }),
});
