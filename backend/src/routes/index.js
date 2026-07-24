const express = require('express');
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const marketingPlanRoutes = require('./marketingPlanRoutes');
const kolRoutes = require('./kolRoutes');
const packageRoutes = require('./packageRoutes');
const socialRoutes = require('./socialRoutes');
const uploadRoutes = require('./uploadRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const scheduledPostRoutes = require('./scheduledPostRoutes');
const mediaRoutes = require('./mediaRoutes');
const budgetRoutes = require('./budgetRoutes');
const kolBookingRoutes = require('./kolBookingRoutes');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Direct business analytics requirement endpoint: GET /api/businesses/:id/analytics
router.get('/businesses/:id/analytics', analyticsController.getBusinessAnalyticsById);

// Mount all feature routers
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/marketing-plans', marketingPlanRoutes);
router.use('/kols', kolRoutes);
router.use('/packages', packageRoutes);
router.use('/social-platforms', socialRoutes);
router.use('/upload', uploadRoutes);
router.use('/market', marketplaceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/scheduled-posts', scheduledPostRoutes);
router.use('/media', mediaRoutes);
router.use('/kol-bookings', kolBookingRoutes);
router.use('/', budgetRoutes);

module.exports = router;
