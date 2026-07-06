import Joi from 'joi';

export const applovinSchema = {
  query: Joi.object({
    managementKey: Joi.string().trim().required().messages({
      'any.required': 'Applovin MAX Management key is mandatory',
      'string.empty': 'Applovin MAX Management key is mandatory',
    }),
  }),
};

export const applovinUpdateSchema = {
  body: Joi.object({
    managementKey: Joi.string().trim().required().messages({
      'any.required': 'Applovin MAX Management key is mandatory',
      'string.empty': 'Applovin MAX Management key is mandatory',
    }),
  }),
};
