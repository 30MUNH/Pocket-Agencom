const express = require('express');
const kolController = require('../controllers/kolController');
const kolDetailController = require('../controllers/kolDetailController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  addMediaSchema,
  addReviewSchema,
  addPerformanceSchema,
} = require('../validators/kolDetail.validator');

const router = express.Router();

// Public route — KOL directory (no auth required)
router.get('/directory', kolController.listPublicDirectory);

// Protected KOL self-serve routes
router.get('/me', authMiddleware, requireRole('kol'), kolController.getMyProfile);
router.put('/me', authMiddleware, requireRole('kol'), kolController.updateMyProfile);

// KOL Profile Details & Extensions
router.get('/:id/profile-details', kolDetailController.getProfileDetails);

// Media portfolio endpoints
router.post(
  '/:id/media',
  authMiddleware,
  validate(addMediaSchema),
  kolDetailController.addMedia
);

router.delete(
  '/:id/media/:mediaId',
  authMiddleware,
  kolDetailController.deleteMedia
);

// SME Reviews endpoints
router.post(
  '/:id/reviews',
  authMiddleware,
  validate(addReviewSchema),
  kolDetailController.addReview
);

// Performance metrics endpoints
router.post(
  '/:id/performance',
  authMiddleware,
  validate(addPerformanceSchema),
  kolDetailController.addPerformance
);

// General KOL listing & lookup
router.use(authMiddleware);
router.get('/', kolController.list);
router.get('/:id', kolController.getById);

module.exports = router;
