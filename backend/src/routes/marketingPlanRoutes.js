const express = require('express');
const marketingPlanController = require('../controllers/marketingPlanController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  generatePlanSchema,
  reviewPlanSchema,
} = require('../validators/marketingPlan.validator');

const router = express.Router();

router.use(authMiddleware);

router.get('/', marketingPlanController.list);
router.get('/:id', marketingPlanController.getById);
router.post(
  '/generate',
  requireRole('user', 'admin'),
  validate(generatePlanSchema),
  marketingPlanController.generate
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
