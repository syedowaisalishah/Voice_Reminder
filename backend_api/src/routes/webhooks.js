const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/twilio', webhookController.handleTwilio);
router.post('/vapi', webhookController.handleVapi);

module.exports = router;
