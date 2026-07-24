const express = require('express');
const scheduledPostController = require('../controllers/scheduledPostController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', scheduledPostController.getPosts);
router.post('/', scheduledPostController.createPost);
router.patch('/:id/status', scheduledPostController.updateStatus);
router.delete('/:id', scheduledPostController.deletePost);

module.exports = router;
