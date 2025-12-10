const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.post('/', reminderController.createReminder);
router.get('/:id', reminderController.getReminder);
router.get('/user/:userId', reminderController.listByUser);

module.exports = router;
