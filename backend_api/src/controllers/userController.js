const userService = require('../services/userService');
const logger = require('../utils/logger');

/**
 * User Controller - Handles HTTP requests/responses only
 * All business logic is in userService
 */

module.exports = {
  /**
   * POST /users - Create a new user
   */
  async createUser(req, res, next) {
    try {
      const { email } = req.body;
      const user = await userService.createUser(email);
      return res.status(201).json(user);
    } catch (err) {
      logger.error({ err }, 'createUser error');
      
      // Map service errors to HTTP responses
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      
      next(err);
    }
  },

  /**
   * GET /users - List all users
   */
  async listUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (err) {
      logger.error({ err }, 'listUsers error');
      next(err);
    }
  }
};
