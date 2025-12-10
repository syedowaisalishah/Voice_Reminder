const User = require('../models/user.model');

/**
 * User Repository - Database access layer for User model
 * Contains ONLY database operations, no business logic
 */

module.exports = {
  create: async (email) => {
    return await User.create({ email });
  },

  findAll: async () => {
    return await User.find().sort({ createdAt: -1 });
  },

  findById: async (id) => {
    return await User.findById(id);
  },

  findByEmail: async (email) => {
    return await User.findOne({ email: email.toLowerCase() });
  }
};
