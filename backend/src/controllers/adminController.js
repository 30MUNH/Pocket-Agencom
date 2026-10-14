const { Prisma } = require('@prisma/client');
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
          avatarMediaAssetId: true,
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

async function getUserAvatarAccess(req, res, next) {
  try {
    const mediaAccessService = require('../services/mediaAccessService').createMediaAccessService();
    const access = await mediaAccessService.getAdminUserAvatarAccess({ requester: req.user, targetUserId: req.params.id });
    return success(res, access);
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

    if (!Number.isSafeInteger(targetUserId) || targetUserId < 1) {
      throw new AppError('Mã người dùng không hợp lệ', 400);
    }
    if (!['active', 'inactive', 'banned'].includes(status)) {
      throw new AppError('Trạng thái không hợp lệ. Phải là active, inactive hoặc banned', 400);
    }

    if (req.user.id === targetUserId && status !== 'active') {
      throw new AppError('Không thể tự vô hiệu hóa tài khoản quản trị viên của chính bạn', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        throw new AppError('Không tìm thấy người dùng', 404);
      }

      if (user.status === 'archived') {
        throw new AppError('Tài khoản đã lưu trữ (archived) không thể thay đổi trạng thái hoặc kích hoạt lại', 400);
      }

      if (user.role === 'admin' && user.status === 'active' && status !== 'active') {
        const activeAdminCount = await tx.user.count({
          where: { role: 'admin', status: 'active' },
        });
        if (activeAdminCount <= 1) {
          throw new AppError('Không thể vô hiệu hóa quản trị viên cuối cùng đang hoạt động', 400);
        }
      }

      return tx.user.update({
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

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

    if (!Number.isSafeInteger(targetUserId) || targetUserId < 1) {
      throw new AppError('Mã người dùng không hợp lệ', 400);
    }
    if (!['user', 'staff', 'admin'].includes(role)) {
      throw new AppError('Vai trò không hợp lệ. Phải là user, staff hoặc admin', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        throw new AppError('Không tìm thấy người dùng', 404);
      }

      if (user.status === 'archived') {
        throw new AppError('Tài khoản đã lưu trữ (archived) không thể thay đổi vai trò', 400);
      }

      if (user.role === 'admin' && user.status === 'active' && role !== 'admin') {
        const activeAdminCount = await tx.user.count({
          where: { role: 'admin', status: 'active' },
        });
        if (activeAdminCount <= 1) {
          throw new AppError('Không thể hạ vai trò của quản trị viên cuối cùng đang hoạt động', 400);
        }
      }

      return tx.user.update({
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserAvatarAccess,
  updateUserStatus,
  updateUserRole,
};
