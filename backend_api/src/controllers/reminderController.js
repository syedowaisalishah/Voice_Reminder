const Reminder = require('../models/reminder.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { isValidPhoneNumber, parseFutureDate } = require('../utils/validators');

module.exports = {
  async createReminder(req, res, next) {
    try {
      const { user_id, phone_number, message, scheduled_at } = req.body;
      if (!user_id || !phone_number || !message || !scheduled_at) {
        return res.status(400).json({ error: 'missing fields' });
      }
      if (!isValidPhoneNumber(phone_number)) return res.status(400).json({ error: 'invalid phone_number' });
      const scheduledDate = parseFutureDate(scheduled_at);
      if (!scheduledDate) return res.status(400).json({ error: 'scheduled_at must be a future ISO datetime' });

      // verify user exists
      const user = await User.findById(user_id);
      if (!user) return res.status(400).json({ error: 'user not found' });

      const reminder = await Reminder.create({
        userId: user_id,
        phoneNumber: phone_number,
        message,
        scheduledAt: scheduledDate,
        status: 'scheduled'
      });
      logger.info({ reminderId: reminder._id }, 'reminder created');
      return res.status(201).json(reminder);
    } catch (err) {
      logger.error({ err }, 'createReminder error');
      next(err);
    }
  },

  async getReminder(req, res, next) {
    try {
      const { id } = req.params;
      const reminder = await Reminder.findById(id).populate('callLogs');
      if (!reminder) return res.status(404).json({ error: 'not found' });
      res.json(reminder);
    } catch (err) {
      logger.error({ err }, 'getReminder error');
      next(err);
    }
  },

  async listByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, page = 1, pageSize = 25 } = req.query;
      const where = { userId };
      if (status) where.status = status;
      const reminders = await Reminder.find(where)
        .sort({ scheduledAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(parseInt(pageSize, 10));
      res.json(reminders);
    } catch (err) {
      logger.error({ err }, 'listByUser error');
      next(err);
    }
  }
};
