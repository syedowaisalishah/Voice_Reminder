const reminderService = require('../services/reminderService');
const logger = require('../utils/logger');

/**
 * Reminder Controller - Handles HTTP requests/responses only
 * All business logic is in reminderService
 */

module.exports = {
  /**
   * POST /reminders - Create a new reminder
   */
  async createReminder(req, res, next) {
    try {
      const { user_id, phone_number, message, scheduled_at } = req.body;
      
      const reminder = await reminderService.createReminder({
        user_id,
        phone_number,
        message,
        scheduled_at
      });
      
      return res.status(201).json(reminder);
    } catch (err) {
      logger.error({ err }, 'createReminder error');
      
      // Map service errors to HTTP responses
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      
      next(err);
    }
  },

  /**
   * GET /reminders/:id - Get a specific reminder
   */
  async getReminder(req, res, next) {
    try {
      const { id } = req.params;
      const reminder = await reminderService.getReminderById(id);
      res.json(reminder);
    } catch (err) {
      logger.error({ err }, 'getReminder error');
      
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      
      next(err);
    }
  },

  /**
   * GET /users/:userId/reminders - List reminders for a user
   */
  async listByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, page, pageSize } = req.query;
      
      const reminders = await reminderService.getRemindersByUser(userId, {
        status,
        page,
        pageSize
      });
      
      res.json(reminders);
    } catch (err) {
      logger.error({ err }, 'listByUser error');
      
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      
      next(err);
    }
  }
};
