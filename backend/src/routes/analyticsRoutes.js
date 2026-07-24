const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/analytics/my-business (Authenticated user's business profile analytics)
router.get('/my-business', authMiddleware, analyticsController.getMyBusinessAnalytics);

// GET /api/analytics/business/:id (Analytics for any specific business profile)
// POST /api/analytics/scrape-url (Extract public stats from platform URL)
router.post('/scrape-url', authMiddleware, analyticsController.scrapeUrl);

module.exports = router;
