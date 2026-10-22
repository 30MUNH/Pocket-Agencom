const { fail } = require('../utils/response');
const { isDatabaseUnavailable } = require('../utils/databaseError');

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

  if (isDatabaseUnavailable(err)) {
    console.error('[Database] PostgreSQL connection unavailable. Check Supabase Connect settings and network access.');
    return fail(res, 'Không thể kết nối cơ sở dữ liệu Supabase. Vui lòng kiểm tra kết nối mạng và cấu hình database.', 503, {
      code: 'DATABASE_UNAVAILABLE',
    });
  }

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ảnh vượt quá dung lượng cho phép (tối đa 4MB). Vui lòng chọn ảnh nhỏ hơn.'
        : `Lỗi tải file: ${err.message}`;
    return fail(res, message, 400);
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
