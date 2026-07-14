const express = require('express');
const packageController = require('../controllers/packageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/:id', packageController.getById);

module.exports = router;
