const reminderRepo = require('../repositories/reminder.repository');
const calllogRepo = require('../repositories/calllog.repository');
const twilioClient = require('../integrations/twilio.client');

module.exports = {
  processDueReminders: async () => {
    const due = await reminderRepo.getDueReminders();

    for (const reminder of due) {
      console.log("Processing reminder", reminder.id);

      const call = await twilioClient.initiateCall(
        reminder.phone_number,
        reminder.message,
        reminder.id
      );

      await reminderRepo.updateReminderStatus(
        reminder.id,
        'processing',
        call.sid
      );

      await calllogRepo.createLog({
        reminder_id: reminder.id,
        external_call_id: call.sid,
        status: 'created',
        received_at: new Date()
      });
    }
  }
};
