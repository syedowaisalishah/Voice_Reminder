const User = require('../models/user.model');

module.exports = {
  createUser: async (email) => {
    return await User.create({ email });
  },

  getAllUsers: async () => {
    return await User.find().sort({ createdAt: -1 });
  },

  getUserById: async (id) => {
    return await User.findById(id);
  }
};
