const reminderRepository = require('../repositories/reminder.repository');
const callLogRepository = require('../repositories/calllog.repository');
const logger = require('../utils/logger');

/**
 * Process Twilio webhook callback
 * Implements idempotency to handle duplicate webhooks
 */
async function processCallWebhook({ callSid, status, reminderId }) {
    logger.info({ reminderId, callSid, status }, 'Processing Twilio webhook callback');

    try {
        // Find reminder by call SID or ID
        let reminder;
        if (reminderId) {
            reminder = await reminderRepository.findReminderById(reminderId);
        } else {
            reminder = await reminderRepository.findReminderByCallSid(callSid);
        }

        if (!reminder) {
            logger.warn({ callSid, reminderId }, 'Reminder not found for webhook');
            return { success: false, message: 'Reminder not found' };
        }

        // Idempotency check: Has this webhook already been processed?
        const alreadyProcessed = await callLogRepository.isWebhookProcessed(
            reminder._id.toString(),
            callSid
        );

        if (alreadyProcessed) {
            logger.info({ reminderId: reminder._id.toString(), callSid }, 'Webhook already processed (idempotent check)');
            return { success: true, message: 'Already processed' };
        }

        // Map Twilio status to our reminder status
        // Twilio statuses: initiated, ringing, in-progress, completed, busy, failed, no-answer, canceled
        let reminderStatus;
        if (status === 'completed') {
            reminderStatus = 'called';
        } else if (['failed', 'busy', 'no-answer', 'canceled'].includes(status)) {
            reminderStatus = 'failed';
        } else {
            // For intermediate statuses, keep as processing
            reminderStatus = 'processing';
        }

        // Only update to final status
        if (reminderStatus === 'called' || reminderStatus === 'failed') {
            await reminderRepository.updateReminderStatus(reminder._id.toString(), reminderStatus);
            logger.info({ reminderId: reminder._id.toString(), status: reminderStatus }, 'Reminder status updated');
        }

        // Update call log with final status
        await callLogRepository.updateCallLog({
            reminderId: reminder._id.toString(),
            externalCallId: callSid,
            status,
            transcript: null // Twilio doesn't provide transcript in basic plan
        });
        logger.info({ reminderId: reminder._id.toString(), callSid }, 'Call log updated');

        return { success: true, message: 'Webhook processed successfully' };

    } catch (error) {
        logger.error({ error: error.message, reminderId, callSid }, 'Failed to process webhook');
        throw error;
    }
}

module.exports = {
    processCallWebhook
};
