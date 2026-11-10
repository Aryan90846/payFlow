export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const badRequest = (message) => new ApiError(400, message);
export const unauthorized = (message = 'Authentication required') =>
  new ApiError(401, message);
export const forbidden = (message = 'You do not have permission to do this') =>
  new ApiError(403, message);
export const notFound = (message = 'Resource not found') =>
  new ApiError(404, message);
export const conflict = (message) => new ApiError(409, message);
