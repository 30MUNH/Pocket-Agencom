const express = require('express');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const marketingPlanRoutes = require('./marketingPlanRoutes');
const kolRoutes = require('./kolRoutes');
const packageRoutes = require('./packageRoutes');
const socialRoutes = require('./socialRoutes');
const uploadRoutes = require('./uploadRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');

const router = express.Router();

// Mount all feature routers
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/marketing-plans', marketingPlanRoutes);
router.use('/kols', kolRoutes);
router.use('/packages', packageRoutes);
router.use('/social-platforms', socialRoutes);
router.use('/upload', uploadRoutes);
router.use('/market', marketplaceRoutes);

module.exports = router;
