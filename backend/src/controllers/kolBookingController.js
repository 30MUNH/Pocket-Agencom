const kolBookingService = require('../services/kolBookingService');
const { success } = require('../utils/response');

/**
 * GET /api/kol-bookings
 */
async function getBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const bookings = await kolBookingService.getBookings(userId);
    return success(res, bookings);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/kol-bookings
 */
async function createBooking(req, res, next) {
  try {
    const userId = req.user.id;
    const booking = await kolBookingService.createBooking(userId, req.body);
    return success(res, booking, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/kol-bookings/:id/status
 */
async function updateStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    const updated = await kolBookingService.updateBookingStatus(userId, id, status);
    return success(res, updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/kol-bookings/:id
 */
async function deleteBooking(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await kolBookingService.deleteBooking(userId, id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBookings,
  createBooking,
  updateStatus,
  deleteBooking
};
