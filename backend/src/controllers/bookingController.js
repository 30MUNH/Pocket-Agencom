const bookingService = require('../services/bookingService');
const { success } = require('../utils/response');

async function create(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    return success(res, booking, 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const bookings = await bookingService.getBookings(req.user);
    return success(res, bookings);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user);
    return success(res, booking);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      req.user,
      req.body
    );
    return success(res, booking);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, updateStatus };
