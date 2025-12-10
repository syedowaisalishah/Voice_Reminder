const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

// Reminder routes
router.post('/', reminderController.createReminder);
router.get('/:id', reminderController.getReminder);

module.exports = router;
