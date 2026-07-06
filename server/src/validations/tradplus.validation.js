import Joi from 'joi';

const tradplusSchema = {
  query: Joi.object().keys({
    bearKey: Joi.string().required().messages({
      'string.empty': '"bearKey" cannot be an empty field',
      'any.required': '"bearKey" is a required field for TradPlus authentication',
    }),
    secretKey: Joi.string().required().messages({
      'string.empty': '"secretKey" cannot be an empty field',
      'any.required': '"secretKey" is a required field for TradPlus authentication',
    }),
    app_uuid: Joi.string().allow(null, '').optional(),
  }),
};

const tradplusUpdateSchema = {
  body: Joi.object().keys({
    bearKey: Joi.string().required().messages({
      'string.empty': '"bearKey" cannot be an empty field',
      'any.required': '"bearKey" is a required field for TradPlus authentication',
    }),
    secretKey: Joi.string().required().messages({
      'string.empty': '"secretKey" cannot be an empty field',
      'any.required': '"secretKey" is a required field for TradPlus authentication',
    }),
    app_uuid: Joi.string().allow(null, '').optional(),
  }),
};

export { tradplusSchema, tradplusUpdateSchema };
