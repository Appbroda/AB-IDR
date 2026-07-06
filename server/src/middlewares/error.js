import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';
import logger from '../config/logger.js';

const errorConverter = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return next(err);
  }

  const error = new ApiError(err.statusCode || 500, err.message || 'Internal Server Error', false);

  next(error);
};

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && {
      stack: err.stack,
    }),
  });
};

export { errorConverter, errorHandler };
