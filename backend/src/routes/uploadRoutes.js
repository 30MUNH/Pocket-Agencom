const express = require('express');
const uploadController = require('../controllers/uploadController');
const { uploadAvatar } = require('../middleware/uploadMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Require logging in for uploading avatars and general media
router.post('/avatar', authMiddleware, uploadAvatar, uploadController.uploadAvatar);
router.post('/single', authMiddleware, uploadAvatar, uploadController.uploadSingle);
router.post('/media', authMiddleware, uploadAvatar, uploadController.uploadSingle);

module.exports = router;
