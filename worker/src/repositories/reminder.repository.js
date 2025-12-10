const Reminder = require('../models/reminder.model');
const logger = require('../utils/logger');

/**
 * Get due reminders that need to be processed
 */
async function getDueReminders(limit = 50) {
  try {
    return await Reminder.find({
      scheduledAt: { $lte: new Date() },
      status: 'scheduled'
    })
      .limit(limit)
      .sort({ scheduledAt: 1 });
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching due reminders');
    throw error;
  }
}

/**
 * Update reminder status
 */
async function updateReminderStatus(id, status, twilioCallSid = null) {
  try {
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (twilioCallSid) {
      updateData.twilioCallSid = twilioCallSid;
    }

    return await Reminder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
  } catch (error) {
    logger.error({ error: error.message, reminderId: id }, 'Error updating reminder status');
    throw error;
  }
}

/**
 * Find reminder by ID
 */
async function findReminderById(id) {
  try {
    return await Reminder.findById(id).populate('callLogs');
  } catch (error) {
    logger.error({ error: error.message, reminderId: id }, 'Error finding reminder');
    throw error;
  }
}

/**
 * Find reminder by Twilio Call SID
 */
async function findReminderByCallSid(twilioCallSid) {
  try {
    return await Reminder.findOne({ twilioCallSid });
  } catch (error) {
    logger.error({ error: error.message, twilioCallSid }, 'Error finding reminder by call SID');
    throw error;
  }
}

module.exports = {
  getDueReminders,
  updateReminderStatus,
  findReminderById,
  findReminderByCallSid
};
