const express = require('express');
const marketplaceController = require('../controllers/marketplaceController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  applyCampaignSchema,
  updateApplicationStatusSchema,
  toggleRecruitingSchema,
} = require('../validators/marketplace.validator');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

const router = express.Router();

// Optional Auth Middleware for public job board browsing
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);
      if (decoded?.userId) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, name: true, email: true, role: true, status: true },
        });
        if (user && user.status === 'active') {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
}

// 1. GET /api/market/campaigns - Fetch campaigns open for KOL applications
router.get('/campaigns', optionalAuth, marketplaceController.getMarketCampaigns);

// 2. POST /api/market/campaigns/:id/apply - KOL applies to a campaign
router.post(
  '/campaigns/:id/apply',
  authMiddleware,
  requireRole('kol', 'admin'),
  validate(applyCampaignSchema),
  marketplaceController.apply
);

// 3. GET /api/market/campaigns/:id/applications - SME views applicants for a campaign
router.get(
  '/campaigns/:id/applications',
  authMiddleware,
  marketplaceController.getApplications
);

// 4. PUT /api/market/applications/:id/status - SME accepts/rejects applicant
router.put(
  '/applications/:id/status',
  authMiddleware,
  validate(updateApplicationStatusSchema),
  marketplaceController.updateStatus
);

// 5. PATCH /api/market/campaigns/:id/toggle-recruiting - SME turns recruiting on/off
router.patch(
  '/campaigns/:id/toggle-recruiting',
  authMiddleware,
  validate(toggleRecruitingSchema),
  marketplaceController.toggleRecruiting
);

module.exports = router;
