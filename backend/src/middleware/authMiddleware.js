const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');
const { fail } = require('../utils/response');
const { AppError } = require('./errorHandler');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return fail(res, 'Authentication required', 401);
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        phone: true,
      },
    });

    if (!user || user.status !== 'active') {
      return fail(res, 'Account is inactive or not found', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.user.role)) {
      return fail(res, 'Insufficient permissions', 403);
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, AppError };
