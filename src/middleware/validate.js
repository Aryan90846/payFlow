import { badRequest } from '../utils/ApiError.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      const error = badRequest('Validation failed');
      error.details = details;
      return next(error);
    }
    req.body = result.data;
    return next();
  };
}
