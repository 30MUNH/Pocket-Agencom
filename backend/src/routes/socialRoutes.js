const express = require('express');
const socialController = require('../controllers/socialController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', socialController.addPlatform);
router.get('/', socialController.getPlatforms);
router.delete('/:id', socialController.deletePlatform);
router.post('/:id/analyze', socialController.triggerAnalysis);

module.exports = router;
