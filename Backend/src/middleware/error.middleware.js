/**
 * Global error handling middleware
 * Formats and sends error responses
 */

// Development error response (more details for debugging)
const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response (less details for security)
const sendProdError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for server side debugging
    console.error('ERROR 💥', err);
    
    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

// Handle MongoDB duplicate key error
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${value}. Please use another value for ${field}.`;
  return { status: 'fail', statusCode: 400, message, isOperational: true };
};

// Handle MongoDB validation error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return { status: 'fail', statusCode: 400, message, isOperational: true };
};

// Handle JWT errors
const handleJWTError = () => {
  return { status: 'fail', statusCode: 401, message: 'Invalid token. Please log in again.', isOperational: true };
};

// Handle JWT expired error
const handleJWTExpiredError = () => {
  return { status: 'fail', statusCode: 401, message: 'Your token has expired. Please log in again.', isOperational: true };
};

// Handle cast error (invalid MongoDB ObjectId)
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return { status: 'fail', statusCode: 400, message, isOperational: true };
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Check environment to determine error format
  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Handle specific error types
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendProdError(error, res);
  }
};

// 404 handler middleware for routes not found
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.status = 'fail';
  error.isOperational = true;
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
