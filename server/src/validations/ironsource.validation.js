import Joi from 'joi';

export const ironSourceFetchSchema = {
  query: Joi.object({
    secretKey: Joi.string().trim().required().messages({
      'any.required': 'IronSource Secret Key is mandatory',
      'string.empty': 'IronSource Secret Key is mandatory',
    }),
    refreshKey: Joi.string().trim().required().messages({
      'any.required': 'IronSource Refresh Key is mandatory',
      'string.empty': 'IronSource Refresh Key is mandatory',
    }),
  }),
};

export const ironSourceUpdateSchema = {
  body: Joi.object({
    secretKey: Joi.string().trim().required().messages({
      'any.required': 'IronSource Secret Key is mandatory',
      'string.empty': 'IronSource Secret Key is mandatory',
    }),
    refreshKey: Joi.string().trim().required().messages({
      'any.required': 'IronSource Refresh Key is mandatory',
      'string.empty': 'IronSource Refresh Key is mandatory',
    }),
  }),
};
