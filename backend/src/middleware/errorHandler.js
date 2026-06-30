const { fail } = require('../utils/response');

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.isOperational) {
    return fail(res, err.message, err.statusCode, err.details);
  }

  if (err.code === 'P2002') {
    return fail(res, 'A record with this value already exists', 409);
  }

  if (err.name === 'JsonWebTokenError') {
    return fail(res, 'Invalid or expired token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return fail(res, 'Token has expired', 401);
  }

  console.error('[API Error]', err);
  return fail(res, 'Internal server error', 500);
}

module.exports = { AppError, errorHandler };
