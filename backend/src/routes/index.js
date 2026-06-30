const express = require('express');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const marketingPlanRoutes = require('./marketingPlanRoutes');
const kolRoutes = require('./kolRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/marketing-plans', marketingPlanRoutes);
router.use('/kols', kolRoutes);

module.exports = router;
