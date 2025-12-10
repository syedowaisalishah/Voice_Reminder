const Reminder = require('../models/reminder.model');

module.exports = {
  createReminder: async (data) => {
    return await Reminder.create(data);
  },

  getReminderById: async (id) => {
    return await Reminder.findById(id).populate('callLogs');
  },

  getUserReminders: async (user_id) => {
    return await Reminder.find({ userId: user_id }).sort({ scheduledAt: -1 });
  },

  updateReminderStatus: async (id, status, external_call_id = null) => {
    const updateData = { status };
    if (external_call_id) {
      updateData.twilioCallSid = external_call_id;
    }
    return await Reminder.findByIdAndUpdate(id, updateData, { new: true });
  },

  getDueReminders: async () => {
    return await Reminder.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() }
    }).limit(50);
  }
};
