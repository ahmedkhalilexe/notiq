import Joi from "joi";

const allowedChannels = ["email", "sms", "in_app", "in-app"];

export const createSubscriberSchema = Joi.object({
  tenant_id: Joi.string().uuid().optional(),
  tenantId: Joi.string().uuid().optional(),
  external_id: Joi.string().trim().max(255).optional(),
  externalId: Joi.string().trim().max(255).optional(),
  name: Joi.string().trim().max(255).optional(),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .max(255)
    .lowercase()
    .optional()
    .messages({
      "string.email": "Please provide a valid email address",
    }),
  phone: Joi.string().trim().max(50).optional(),
  channels: Joi.array()
    .items(
      Joi.object({
        channel: Joi.string()
          .trim()
          .valid(...allowedChannels)
          .required()
          .messages({
            "any.only": "Channel must be one of: email, sms, in_app, in-app",
          }),
        enabled: Joi.boolean().default(true),
        value: Joi.string().trim().max(255).allow(null, "").optional(),
      }),
    )
    .optional(),
});

export const updateSubscriberSchema = Joi.object({
  external_id: Joi.string().trim().max(255).allow(null, "").optional(),
  externalId: Joi.string().trim().max(255).allow(null, "").optional(),
  name: Joi.string().trim().max(255).allow(null, "").optional(),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .max(255)
    .lowercase()
    .allow(null, "")
    .optional()
    .messages({
      "string.email": "Please provide a valid email address",
    }),
  phone: Joi.string().trim().max(50).allow(null, "").optional(),
  channels: Joi.array()
    .items(
      Joi.object({
        channel: Joi.string()
          .trim()
          .valid(...allowedChannels)
          .required()
          .messages({
            "any.only": "Channel must be one of: email, sms, in_app, in-app",
          }),
        enabled: Joi.boolean().default(true),
        value: Joi.string().trim().max(255).allow(null, "").optional(),
      }),
    )
    .optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to update",
  });

export const updatePreferenceSchema = Joi.object({
  channel: Joi.string()
    .trim()
    .valid(...allowedChannels)
    .required()
    .messages({
      "any.only": "Channel must be one of: email, sms, in_app, in-app",
      "any.required": "Channel is required",
    }),
  enabled: Joi.boolean().required().messages({
    "any.required": "Enabled status (true/false) is required",
  }),
  value: Joi.string().trim().max(255).allow(null, "").optional(),
});

export const findSubscriberParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "ID is required",
    "string.guid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});

export const listSubscribersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  tenant_id: Joi.string().uuid().optional(),
  tenantId: Joi.string().uuid().optional(),
  channel: Joi.string()
    .trim()
    .valid(...allowedChannels)
    .optional(),
  enabled: Joi.boolean().optional(),
});
