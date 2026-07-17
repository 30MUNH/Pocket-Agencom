const express = require('express');
const uploadController = require('../controllers/uploadController');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Require logging in for uploading avatars
router.post('/avatar', authMiddleware, uploadAvatar, uploadController.uploadAvatar);

module.exports = router;
