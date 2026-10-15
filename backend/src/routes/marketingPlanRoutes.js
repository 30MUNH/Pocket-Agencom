const express = require('express');
const marketingPlanController = require('../controllers/marketingPlanController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { uploadCampaignImage } = require('../middleware/uploadMiddleware');
const {
  generatePlanSchema,
  reviewPlanSchema,
  generatePostSchema,
  refinePlanSchema,
  generateImagePromptSchema,
  generateSocialImageSchema,
} = require('../validators/marketingPlan.validator');

const router = express.Router();

router.use(authMiddleware);

router.get('/', marketingPlanController.list);
router.get('/trends', marketingPlanController.getTrends);
router.post('/trends/refresh', requireRole('user', 'admin'), marketingPlanController.refreshTrends);
router.put('/:id/assets', marketingPlanController.updateMediaAssets);
router.delete('/:id/assets/:assetId', marketingPlanController.removeMediaAsset);
router.get('/:id', marketingPlanController.getById);
router.post(
  '/generate',
  requireRole('user', 'admin'),
  validate(generatePlanSchema),
  marketingPlanController.generate
);
router.post(
  '/generate-post',
  requireRole('user', 'admin'),
  validate(generatePostSchema),
  marketingPlanController.generatePost
);
router.post(
  '/generate-post-with-image',
  requireRole('user', 'admin'),
  uploadCampaignImage,
  marketingPlanController.generatePostWithImage
);
router.post(
  '/generate-image-prompt',
  requireRole('user', 'admin'),
  validate(generateImagePromptSchema),
  marketingPlanController.generateImagePrompt
);
router.post(
  '/generate-image',
  requireRole('user', 'admin'),
  validate(generateSocialImageSchema),
  marketingPlanController.generateSocialImage
);
router.post(
  '/:id/refine',
  requireRole('user', 'admin'),
  validate(refinePlanSchema),
  marketingPlanController.refine
);
router.post('/:id/save', requireRole('user', 'admin'), marketingPlanController.save);
router.patch(
  '/:id/review',
  requireRole('staff', 'admin'),
  validate(reviewPlanSchema),
  marketingPlanController.review
);
router.delete('/:id', requireRole('user', 'admin'), marketingPlanController.remove);

module.exports = router;
