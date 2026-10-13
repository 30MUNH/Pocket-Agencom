const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const ticketController = require('../controllers/supportTicketController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.patch('/:id/status', ticketController.updateTicketStatus);

module.exports = router;
