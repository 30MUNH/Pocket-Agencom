const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
