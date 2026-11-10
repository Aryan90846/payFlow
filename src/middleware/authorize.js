import { forbidden } from '../utils/ApiError.js';

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden());
    }
    return next();
  };
}

export const requireAdmin = authorize('admin');
