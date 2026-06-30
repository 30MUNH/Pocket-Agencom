const express = require('express');
const kolController = require('../controllers/kolController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', kolController.list);
router.get('/:id', kolController.getById);

module.exports = router;
