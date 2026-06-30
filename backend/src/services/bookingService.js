const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { isValidTransition } = require('../validators/booking.validator');

function formatBooking(booking) {
  return {
    ...booking,
    budget: booking.budget ? Number(booking.budget) : null,
    kol: booking.kol
      ? {
          ...booking.kol,
          priceFrom: booking.kol.priceFrom ? Number(booking.kol.priceFrom) : null,
          engagementRate: booking.kol.engagementRate ? Number(booking.kol.engagementRate) : null,
          rating: booking.kol.rating ? Number(booking.kol.rating) : null,
        }
      : undefined,
    package: booking.package
      ? { ...booking.package, price: Number(booking.package.price) }
      : undefined,
  };
}

async function createBooking(userId, data) {
  const kol = await prisma.kolProfile.findFirst({
    where: { id: data.kolId, status: 'active' },
    include: { servicePackages: { where: { id: data.packageId, status: 'active' } } },
  });

  if (!kol) {
    throw new AppError('KOL not found or inactive', 404);
  }

  if (!kol.servicePackages.length) {
    throw new AppError('Service package not found for this KOL', 404);
  }

  const pkg = kol.servicePackages[0];

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.kolBooking.create({
      data: {
        userId,
        kolId: data.kolId,
        packageId: data.packageId,
        campaignName: data.campaignName,
        campaignGoal: data.campaignGoal,
        productName: data.productName,
        productDescription: data.productDescription,
        productCategory: data.productCategory,
        targetCustomer: data.targetCustomer,
        campaignPlatform: data.campaignPlatform,
        campaignDate: data.campaignDate ? new Date(data.campaignDate) : null,
        budget: data.budget ?? pkg.price,
        contentRequirements: data.contentRequirements,
        doAndDontNotes: data.doAndDontNotes,
        deliveryAddress: data.deliveryAddress,
        referenceLink: data.referenceLink || null,
        productImages: data.productImages,
        status: 'pending',
      },
      include: {
        kol: { select: { id: true, name: true, avatarUrl: true, niche: true } },
        package: { select: { id: true, packageName: true, price: true, serviceType: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Booking submitted',
        message: `Your campaign "${data.campaignName}" has been submitted and is pending staff review.`,
        type: 'booking',
      },
    });

    const staffUsers = await tx.user.findMany({
      where: { role: 'staff', status: 'active' },
      select: { id: true },
      take: 5,
    });

    for (const staff of staffUsers) {
      await tx.notification.create({
        data: {
          userId: staff.id,
          title: 'New booking request',
          message: `New KOL booking "${data.campaignName}" requires review.`,
          type: 'booking',
        },
      });
    }

    return created;
  });

  return formatBooking(booking);
}

async function getBookings(user) {
  const where =
    user.role === 'staff' || user.role === 'admin'
      ? {}
      : { userId: user.id };

  const bookings = await prisma.kolBooking.findMany({
    where,
    include: {
      kol: { select: { id: true, name: true, avatarUrl: true } },
      package: { select: { id: true, packageName: true, price: true } },
      user: { select: { id: true, name: true, email: true } },
      assignedStaff: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookings.map(formatBooking);
}

async function getBookingById(id, user) {
  const booking = await prisma.kolBooking.findUnique({
    where: { id: Number(id) },
    include: {
      kol: {
        include: {
          platformAccounts: true,
          servicePackages: { where: { status: 'active' } },
        },
      },
      package: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
      assignedStaff: { select: { id: true, name: true, email: true } },
      reviews: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (user.role === 'user' && booking.userId !== user.id) {
    throw new AppError('Access denied', 403);
  }

  return formatBooking(booking);
}

async function updateBookingStatus(id, staffUser, { status, assignedStaffId, note }) {
  const booking = await prisma.kolBooking.findUnique({ where: { id: Number(id) } });
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  if (!isValidTransition(booking.status, status)) {
    throw new AppError(
      `Invalid status transition from "${booking.status}" to "${status}"`,
      422
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.kolBooking.update({
      where: { id: Number(id) },
      data: {
        status,
        assignedStaffId: assignedStaffId ?? staffUser.id,
      },
      include: {
        kol: { select: { id: true, name: true, avatarUrl: true } },
        package: { select: { id: true, packageName: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    const statusMessages = {
      staff_reviewing: 'Your booking is now being reviewed by our staff.',
      need_more_info: 'We need more information about your booking. Please check your notifications.',
      approved: 'Your booking has been approved!',
      confirmed: 'Your booking is confirmed and scheduled.',
      in_progress: 'Your campaign is now in progress.',
      content_submitted: 'Content has been submitted for your review.',
      completed: 'Your campaign has been completed successfully!',
      cancelled: 'Your booking has been cancelled.',
    };

    if (statusMessages[status]) {
      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: `Booking ${status.replace(/_/g, ' ')}`,
          message: note || statusMessages[status],
          type: 'booking',
        },
      });
    }

    return result;
  });

  return formatBooking(updated);
}

module.exports = { createBooking, getBookings, getBookingById, updateBookingStatus };
