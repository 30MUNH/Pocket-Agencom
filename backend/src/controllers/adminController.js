const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const { search, status } = req.query;

    const where = {};
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          phone: true,
          createdAt: true,
          businessProfile: {
            select: {
              id: true,
              businessName: true,
              businessType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, { users, total });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 */
async function updateUserStatus(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      throw new AppError('Trạng thái không hợp lệ. Phải là active, inactive hoặc banned', 400);
    }

    if (req.user.id === targetUserId && status !== 'active') {
      throw new AppError('Không thể tự vô hiệu hóa tài khoản quản trị viên của chính bạn', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
      },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/role
 */
async function updateUserRole(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!['user', 'staff', 'admin'].includes(role)) {
      throw new AppError('Vai trò không hợp lệ. Phải là user, staff hoặc admin', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
      },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
};
