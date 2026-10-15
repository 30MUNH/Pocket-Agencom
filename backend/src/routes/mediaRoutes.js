const express = require('express');
const mediaController = require('../controllers/mediaController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { generateSocialImageSchema } = require('../validators/marketingPlan.validator');

const router = express.Router();

router.use(authMiddleware);

router.get('/', mediaController.getMediaAssets);
router.post('/', mediaController.uploadMedia);
router.post('/generate-image', validate(generateSocialImageSchema), mediaController.generateImage);
router.get('/:id/access', mediaController.getMediaAssetAccess);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
