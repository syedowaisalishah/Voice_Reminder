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
      // Support both camelCase (from frontend) and snake_case (REST convention)
      const { 
        user_id, userId,
        phone_number, phoneNumber,
        message, 
        scheduled_at, scheduledAt 
      } = req.body;
      
      const reminder = await reminderService.createReminder({
        user_id: user_id || userId,
        phone_number: phone_number || phoneNumber,
        message,
        scheduled_at: scheduled_at || scheduledAt
      });
      
      // Return formatted response
      return res.status(201).json({
        success: true,
        data: reminder
      });
    } catch (err) {
      logger.error({ err }, 'createReminder error');
      
      // Map service errors to HTTP responses
      if (err.statusCode) {
        return res.status(err.statusCode).json({ 
          success: false,
          error: err.message 
        });
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
      
      return res.json({
        success: true,
        data: reminder
      });
    } catch (err) {
      logger.error({ err }, 'getReminder error');
      
      if (err.statusCode) {
        return res.status(err.statusCode).json({ 
          success: false,
          error: err.message 
        });
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
      
      return res.json({
        success: true,
        data: reminders,
        meta: {
          userId,
          status: status || 'all',
          count: reminders.length
        }
      });
    } catch (err) {
      logger.error({ err }, 'listByUser error');
      
      if (err.statusCode) {
        return res.status(err.statusCode).json({ 
          success: false,
          error: err.message 
        });
      }
      
      next(err);
    }
  }
};
