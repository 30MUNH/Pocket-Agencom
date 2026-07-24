const express = require('express');
const mediaController = require('../controllers/mediaController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', mediaController.getMediaAssets);
router.post('/', mediaController.uploadMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
