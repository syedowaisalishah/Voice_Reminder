const reminderRepository = require('../repositories/reminder.repository');
const callLogRepository = require('../repositories/calllog.repository');
const logger = require('../utils/logger');

/**
 * Process webhook callback from Voice Provider
 * Implements idempotency to handle duplicate webhooks
 */
async function processCallWebhook({ reminderId, externalCallId, status, transcript }) {
    logger.info({ reminderId, externalCallId, status }, 'Processing webhook callback');

    try {
        // Idempotency check: Has this webhook already been processed?
        const alreadyProcessed = await callLogRepository.isWebhookProcessed(reminderId, externalCallId);

        if (alreadyProcessed) {
            logger.info({ reminderId, externalCallId }, 'Webhook already processed (idempotent check)');
            return { success: true, message: 'Already processed' };
        }

        // Map Voice Provider status to our reminder status
        const reminderStatus = (status === 'completed') ? 'called' : 'failed';

        // Update reminder status
        await reminderRepository.updateReminderStatus(reminderId, reminderStatus);
        logger.info({ reminderId, status: reminderStatus }, 'Reminder status updated');

        // Update call log with final status and transcript
        await callLogRepository.updateCallLog({
            reminderId,
            externalCallId,
            status,
            transcript
        });
        logger.info({ reminderId, externalCallId }, 'Call log updated');

        return { success: true, message: 'Webhook processed successfully' };

    } catch (error) {
        logger.error({ error: error.message, reminderId }, 'Failed to process webhook');
        throw error;
    }
}

module.exports = {
    processCallWebhook
};
