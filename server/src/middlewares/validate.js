import Joi from 'joi';

import pick from '../utils/pick.js';
import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));

  const { value, error } = Joi.compile(validSchema)
    .prefs({
      errors: { label: 'key' },
      abortEarly: false,
    })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');

    return next(new ApiError(400, errorMessage));
  }

  Object.assign(req, value);
  next();
};

export default validate;
