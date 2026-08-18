/**
 * Custom error class with status code
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new API error with specific message and status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {ApiError} - Custom error object
 */
exports.createError = (message, statusCode) => {
  return new ApiError(message, statusCode);
};

/**
 * Handle 404 errors (Not Found)
 * @param {string} message - Error message
 * @returns {ApiError} - Not found error
 */
exports.notFound = (message = 'Resource not found') => {
  return new ApiError(message, 404);
};

/**
 * Handle 400 errors (Bad Request)
 * @param {string} message - Error message
 * @returns {ApiError} - Bad request error
 */
exports.badRequest = (message = 'Bad request') => {
  return new ApiError(message, 400);
};

/**
 * Handle 401 errors (Unauthorized)
 * @param {string} message - Error message
 * @returns {ApiError} - Unauthorized error
 */
exports.unauthorized = (message = 'Authentication required') => {
  return new ApiError(message, 401);
};

/**
 * Handle 403 errors (Forbidden)
 * @param {string} message - Error message
 * @returns {ApiError} - Forbidden error
 */
exports.forbidden = (message = 'Access denied') => {
  return new ApiError(message, 403);
};

/**
 * Handle 500 errors (Server Error)
 * @param {string} message - Error message
 * @returns {ApiError} - Server error
 */
exports.serverError = (message = 'Internal server error') => {
  return new ApiError(message, 500);
};

/**
 * Async error handler to avoid try-catch blocks
 * @param {Function} fn - Async function
 * @returns {Function} - Express middleware function
 */
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
