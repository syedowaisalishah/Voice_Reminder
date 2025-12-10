const reminderRepo = require('../repositories/reminder.repository');
const userRepo = require('../repositories/user.repository');
const twilioClient = require('../integrations/twilio.client');
const vapiClient = require('../integrations/vapi.client');

module.exports = {
  createReminder: async (data) => {
    const user = await userRepo.getUserById(data.user_id);
    if (!user) throw new Error("User does not exist");

    if (!/^\+\d{10,15}$/.test(data.phone_number))
      throw new Error("Invalid phone number");

    return await reminderRepo.createReminder({
      ...data,
      status: "scheduled"
    });
  },

  getReminderDetails: async (id) => {
    return await reminderRepo.getReminderById(id);
  }
};
