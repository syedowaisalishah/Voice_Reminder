const CallLog = require('../models/calllog.model');

module.exports = {
  createLog: async (data) => {
    return await CallLog.create(data);
  },

  getLogsByReminderId: async (reminder_id) => {
    return await CallLog.find({ reminderId: reminder_id }).sort({ receivedAt: -1 });
  }
};
