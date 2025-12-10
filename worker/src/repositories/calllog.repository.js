const prisma = require('../config/db');

/**
 * Create a call log entry
 */
async function createCallLog({ reminderId, externalCallId, status, provider = 'voice-provider' }) {
  return await prisma.callLog.create({
    data: {
      reminderId,
      externalCallId,
      status,
      provider,
      receivedAt: new Date()
    }
  });
}

/**
 * Update call log with webhook data
 */
async function updateCallLog({ reminderId, externalCallId, status, transcript }) {
  return await prisma.callLog.updateMany({
    where: {
      reminderId,
      externalCallId
    },
    data: {
      status,
      transcript,
      receivedAt: new Date()
    }
  });
}

/**
 * Find call log by reminder ID and external call ID
 */
async function findCallLog(reminderId, externalCallId) {
  return await prisma.callLog.findFirst({
    where: {
      reminderId,
      externalCallId
    }
  });
}

/**
 * Check if webhook has already been processed (for idempotency)
 */
async function isWebhookProcessed(reminderId, externalCallId) {
  const log = await prisma.callLog.findFirst({
    where: {
      reminderId,
      externalCallId,
      status: { in: ['completed', 'failed'] }
    }
  });
  return !!log;
}

module.exports = {
  createCallLog,
  updateCallLog,
  findCallLog,
  isWebhookProcessed
};
