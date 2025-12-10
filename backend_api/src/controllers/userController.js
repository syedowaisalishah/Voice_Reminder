const User = require('../models/user.model');
const logger = require('../utils/logger');

module.exports = {
  async createUser(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email is required' });
      const user = await User.create({ email });
      return res.status(201).json(user);
    } catch (err) {
      logger.error({ err }, 'createUser error');
      // MongoDB duplicate key error code is 11000
      if (err.code === 11000) return res.status(400).json({ error: 'email already exists' });
      next(err);
    }
  },

  async listUsers(req, res, next) {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      logger.error({ err }, 'listUsers error');
      next(err);
    }
  }
};
