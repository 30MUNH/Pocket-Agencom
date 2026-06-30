const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  createBookingSchema,
  updateBookingStatusSchema,
} = require('../validators/booking.validator');

const router = express.Router();

router.use(authMiddleware);

router.get('/', bookingController.list);
router.get('/:id', bookingController.getById);
router.post('/', requireRole('user', 'admin'), validate(createBookingSchema), bookingController.create);
router.patch(
  '/:id/status',
  requireRole('staff', 'admin'),
  validate(updateBookingStatusSchema),
  bookingController.updateStatus
);

module.exports = router;
