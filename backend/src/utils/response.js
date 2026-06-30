function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, error: null });
}

function fail(res, message, statusCode = 400, details = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: { message, ...(details ? { details } : {}) },
  });
}

module.exports = { success, fail };
