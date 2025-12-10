
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const reminderController = require('../controllers/reminderController');

// User routes
router.post('/', userController.createUser);
router.get('/', userController.listUsers);

// User's reminders route - GET /users/:userId/reminders
router.get('/:userId/reminders', reminderController.listByUser);

module.exports = router;
