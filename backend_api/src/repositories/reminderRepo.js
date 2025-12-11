const Reminder = require('../models/reminder.model');

/**
 * Reminder Repository - Database access layer for Reminder model
 * Contains ONLY database operations, no business logic
 */

module.exports = {
  create: async (reminderData) => {
    return await Reminder.create(reminderData);
  },

  findById: async (id) => {
    return await Reminder.findById(id);
  },

  findByUserId: async (filter, options = {}) => {
    const { skip = 0, limit = 25 } = options;
    return await Reminder.find(filter)
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  update: async (id, updateData) => {
    return await Reminder.findByIdAndUpdate(id, updateData, { new: true });
  },

  getDueReminders: async () => {
    return await Reminder.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() }
    }).limit(50);
  }
};
