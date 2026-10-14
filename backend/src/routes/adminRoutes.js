const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/users/:id/avatar-access', requireRole('admin', 'staff'), adminController.getUserAvatarAccess);
router.use(requireRole('admin'));

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);

module.exports = router;
