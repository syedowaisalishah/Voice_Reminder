const CallLog = require('../models/calllog.model');
const logger = require('../utils/logger');

/**
 * Create a call log entry
 */
async function createCallLog({ reminderId, externalCallId, status, provider = 'twilio' }) {
  try {
    return await CallLog.create({
      reminderId,
      externalCallId,
      status,
      provider,
      receivedAt: new Date()
    });
  } catch (error) {
    logger.error({ error: error.message, reminderId }, 'Error creating call log');
    throw error;
  }
}

/**
 * Update call log with webhook data
 */
async function updateCallLog({ reminderId, externalCallId, status, transcript }) {
  try {
    return await CallLog.findOneAndUpdate(
      {
        reminderId,
        externalCallId
      },
      {
        status,
        transcript,
        receivedAt: new Date()
      },
      { new: true, upsert: false }
    );
  } catch (error) {
    logger.error({ error: error.message, reminderId }, 'Error updating call log');
    throw error;
  }
}

/**
 * Find call log by reminder ID and external call ID
 */
async function findCallLog(reminderId, externalCallId) {
  try {
    return await CallLog.findOne({
      reminderId,
      externalCallId
    });
  } catch (error) {
    logger.error({ error: error.message, reminderId }, 'Error finding call log');
    throw error;
  }
}

/**
 * Check if webhook has already been processed (for idempotency)
 */
async function isWebhookProcessed(reminderId, externalCallId) {
  try {
    const log = await CallLog.findOne({
      reminderId,
      externalCallId,
      status: { $in: ['completed', 'failed'] }
    });
    return !!log;
  } catch (error) {
    logger.error({ error: error.message, reminderId }, 'Error checking webhook processed status');
    return false;
  }
}

module.exports = {
  createCallLog,
  updateCallLog,
  findCallLog,
  isWebhookProcessed
};
