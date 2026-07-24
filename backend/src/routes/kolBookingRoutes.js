const express = require('express');
const kolBookingController = require('../controllers/kolBookingController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', kolBookingController.getBookings);
router.post('/', kolBookingController.createBooking);
router.patch('/:id/status', kolBookingController.updateStatus);
router.delete('/:id', kolBookingController.deleteBooking);

module.exports = router;
