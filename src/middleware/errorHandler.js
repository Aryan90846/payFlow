import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central handler: safe messages to clients, full detail only in dev logs.
export function errorHandler(error, req, res, next) {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation failed' });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid id format' });
  }

  const status = error.statusCode || 500;
  const body = { success: false, message: error.message || 'Internal server error' };
  if (error.details) body.details = error.details;
  if (env.nodeEnv === 'development' && status === 500) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return res.status(status).json(body);
}
