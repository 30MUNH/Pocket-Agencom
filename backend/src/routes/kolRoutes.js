const express = require('express');
const kolController = require('../controllers/kolController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route — KOL directory (no auth required)
router.get('/directory', kolController.listPublicDirectory);

// Protected KOL self-serve routes
router.get('/me', authMiddleware, requireRole('kol'), kolController.getMyProfile);
router.put('/me', authMiddleware, requireRole('kol'), kolController.updateMyProfile);

// Protected marketplace routes (existing — for logged-in brand users)
router.use(authMiddleware);
router.get('/', kolController.list);
router.get('/:id', kolController.getById);

module.exports = router;
