const analyticsService = require('../services/analyticsService');
const { success } = require('../utils/response');

/**
 * Controller to fetch analytics aggregated by platform for a specific business ID.
 * GET /api/businesses/:id/analytics
 */
async function getBusinessAnalyticsById(req, res, next) {
  try {
    const { id } = req.params;
    const analyticsData = await analyticsService.getBusinessAnalytics(id, null);
    return success(res, analyticsData);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller to fetch analytics aggregated by platform for the authenticated user's business.
 * GET /api/analytics/my-business
 */
async function getMyBusinessAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const analyticsData = await analyticsService.getBusinessAnalytics(null, userId);
    return success(res, analyticsData);
  } catch (err) {
    next(err);
  }
}

const scraperService = require('../services/scraperService');

/**
 * Controller to trigger scraping public metrics from a platform URL.
 * POST /api/analytics/scrape-url
 */
async function scrapeUrl(req, res, next) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Đường dẫn URL là bắt buộc.' }
      });
    }

    const metrics = await scraperService.scrapePublicMetrics(url);
    return success(res, { url, metrics });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBusinessAnalyticsById,
  getMyBusinessAnalytics,
  scrapeUrl
};
