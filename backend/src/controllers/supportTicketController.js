const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
async function createTicket(req, res, next) {
  try {
    const userId = req.user.id;
    const { subject, message, category } = req.body;

    if (!subject || !subject.trim()) {
      throw new AppError('Tiêu đề yêu cầu hỗ trợ là bắt buộc', 400);
    }
    if (!message || !message.trim()) {
      throw new AppError('Nội dung yêu cầu hỗ trợ là bắt buộc', 400);
    }

    const validCategories = ['account', 'marketing_plan', 'payment', 'technical', 'other'];
    const chosenCategory = validCategories.includes(category) ? category : 'other';

    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId,
          subject: subject.trim(),
          message: message.trim(),
          category: chosenCategory,
          status: 'open',
        },
      });
      return success(res, ticket, 201);
    } catch (dbErr) {
      throw new AppError('Dịch vụ hỗ trợ tạm thời không khả dụng. Yêu cầu chưa được gửi, vui lòng thử lại.', 503);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/support/tickets
 * Get tickets for authenticated user (or all tickets if staff/admin)
 */
async function getTickets(req, res, next) {
  try {
    const user = req.user;
    const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';

    const where = isStaffOrAdmin ? {} : { userId: user.id };
    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return success(res, tickets);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/support/tickets/:id/status
 * Update ticket status (staff/admin or ticket owner to close)
 */
async function updateTicketStatus(req, res, next) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const user = req.user;

    const validStatuses = ['open', 'in_progress', 'resolved', 'escalated', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Trạng thái ticket không hợp lệ', 400);
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });

    if (!ticket) {
      throw new AppError('Không tìm thấy yêu cầu hỗ trợ', 404);
    }

    const isOwner = ticket.userId === user.id;
    const isStaffOrAdmin = user.role === 'staff' || user.role === 'admin';

    if (!isStaffOrAdmin && (!isOwner || status !== 'closed')) {
      throw new AppError('Bạn không có quyền cập nhật trạng thái yêu cầu này', 403);
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTicket,
  getTickets,
  updateTicketStatus,
};
