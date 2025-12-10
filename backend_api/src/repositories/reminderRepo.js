const Reminder = require('../models/reminder.model');

module.exports = {
  createReminder: async (data) => {
    return await Reminder.create(data);
  },

  getReminderById: async (id) => {
    return await Reminder.findByPk(id);
  },

  getUserReminders: async (user_id) => {
    return await Reminder.findAll({ where: { user_id } });
  },

  updateReminderStatus: async (id, status, external_call_id = null) => {
    return await Reminder.update(
      { status, external_call_id },
      { where: { id } }
    );
  },

  getDueReminders: async () => {
    return await Reminder.findAll({
      where: {
        status: 'scheduled',
        scheduled_at: { [Op.lte]: new Date() }
      }
    });
  }
};
