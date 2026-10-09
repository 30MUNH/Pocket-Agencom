const express = require('express');
const authRoutes = require('./authRoutes');
const marketingPlanRoutes = require('./marketingPlanRoutes');
const socialRoutes = require('./socialRoutes');
const uploadRoutes = require('./uploadRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const scheduledPostRoutes = require('./scheduledPostRoutes');
const mediaRoutes = require('./mediaRoutes');
const budgetRoutes = require('./budgetRoutes');
const adminRoutes = require('./adminRoutes');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Direct business analytics requirement endpoint: GET /api/businesses/:id/analytics
router.get('/businesses/:id/analytics', analyticsController.getBusinessAnalyticsById);

// Mount all feature routers
router.use('/auth', authRoutes);
router.use('/marketing-plans', marketingPlanRoutes);
router.use('/social-platforms', socialRoutes);
router.use('/upload', uploadRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/scheduled-posts', scheduledPostRoutes);
router.use('/media', mediaRoutes);
router.use('/admin', adminRoutes);
router.use('/', budgetRoutes);

module.exports = router;
