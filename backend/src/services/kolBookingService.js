const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

// Memory fallback store in case database tables are not migrated yet
let demoKolBookingsStore = [
  {
    id: 201,
    userId: 1,
    kolName: 'Linh Ngọc Đàm',
    kolPlatform: 'TikTok',
    kolContactLink: 'https://tiktok.com/@linhngocdam',
    kolStatus: 'INVITATION_SENT',
    scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    note: 'Mời hợp tác video review trải nghiệm sản phẩm mới',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 202,
    userId: 1,
    kolName: 'Duy Thẩm',
    kolPlatform: 'YouTube',
    kolContactLink: 'https://youtube.com/@duytham',
    kolStatus: 'NEGOTIATING',
    scheduledDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    note: 'Đang thương lượng chi phí lên video dài 8 phút',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 203,
    userId: 1,
    kolName: 'Hà Linh Official',
    kolPlatform: 'TikTok',
    kolContactLink: 'https://tiktok.com/@halinhofficial',
    kolStatus: 'ACCEPTED',
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    note: 'KOL đã chấp nhận thỏa thuận & gửi lịch quay',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 204,
    userId: 1,
    kolName: 'Trinh Phạm',
    kolPlatform: 'Instagram',
    kolContactLink: 'https://instagram.com/trinhpham',
    kolStatus: 'COMPLETED',
    scheduledDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    note: 'Đã xuất bản post Instagram story & feed',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

/**
 * Creates a new KOL invitation/booking.
 */
async function createBooking(userId, bookingData) {
  const {
    kolName,
    kolPlatform = 'TikTok',
    kolContactLink,
    scheduledDate,
    note,
    campaignName = 'Chiến dịch tiếp thị'
  } = bookingData;

  if (!kolName) {
    throw new AppError('Tên KOL/KOC là bắt buộc.', 400);
  }

  try {
    const booking = await prisma.kolBooking.create({
      data: {
        userId,
        kolName,
        kolPlatform,
        kolContactLink: kolContactLink || '',
        campaignName,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 86400000 * 3),
        note: note || 'Đã gửi lời mời hợp tác',
        kolStatus: 'INVITATION_SENT'
      }
    });
    return booking;
  } catch (err) {
    console.warn('[Prisma Fallback] KolBooking create fallback to memory store:', err.message);
    const booking = {
      id: Date.now(),
      userId,
      kolName,
      kolPlatform,
      kolContactLink: kolContactLink || '',
      campaignName,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date(Date.now() + 86400000 * 3).toISOString(),
      note: note || 'Đã gửi lời mời hợp tác',
      kolStatus: 'INVITATION_SENT',
      createdAt: new Date().toISOString()
    };
    demoKolBookingsStore.unshift(booking);
    return booking;
  }
}

/**
 * Gets all KOL bookings for a user.
 */
async function getBookings(userId) {
  try {
    const bookings = await prisma.kolBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (bookings && bookings.length > 0) {
      return bookings;
    }
  } catch (err) {
    console.warn('[Prisma Fallback] Falling back to demo KOL bookings memory store');
  }

  return demoKolBookingsStore;
}

/**
 * Updates booking status (e.g. INVITATION_SENT -> NEGOTIATING -> ACCEPTED -> COMPLETED / CANCELLED).
 */
async function updateBookingStatus(userId, bookingId, kolStatus) {
  const idNum = parseInt(bookingId, 10);

  try {
    const updated = await prisma.kolBooking.update({
      where: { id: idNum },
      data: { kolStatus }
    });
    return updated;
  } catch (err) {
    console.warn('[Prisma Fallback] Updating KOL booking status in memory store:', err.message);
    const target = demoKolBookingsStore.find(b => b.id === idNum);
    if (target) {
      target.kolStatus = kolStatus;
      return target;
    }
    throw new AppError('Không tìm thấy lịch đặt KOL.', 404);
  }
}

/**
 * Deletes a booking record.
 */
async function deleteBooking(userId, bookingId) {
  const idNum = parseInt(bookingId, 10);

  try {
    await prisma.kolBooking.delete({
      where: { id: idNum }
    });
    return { deleted: true };
  } catch (err) {
    console.warn('[Prisma Fallback] Deleting KOL booking in memory store:', err.message);
    demoKolBookingsStore = demoKolBookingsStore.filter(b => b.id !== idNum);
    return { deleted: true };
  }
}

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking
};
