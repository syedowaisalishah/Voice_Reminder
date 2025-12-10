const CallLog = require('../models/calllog.model');

module.exports = {
  createLog: async (data) => {
    return await CallLog.create(data);
  },

  getLogsByReminderId: async (reminder_id) => {
    return await CallLog.findAll({ where: { reminder_id } });
  }
};
