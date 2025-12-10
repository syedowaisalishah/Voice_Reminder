const User = require('../models/user.model');

module.exports = {
  createUser: async (email) => {
    return await User.create({ email });
  },

  getAllUsers: async () => {
    return await User.findAll();
  },

  getUserById: async (id) => {
    return await User.findByPk(id);
  }
};
