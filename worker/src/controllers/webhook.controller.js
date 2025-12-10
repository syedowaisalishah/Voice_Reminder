const reminderService = require('../services/reminder.service');
const logger = require('../utils/logger');

/**
 * Handle incoming Twilio webhook callback
 * POST /webhooks/call-status
 */
async function handleCallStatus(req, res) {
    logger.info({ body: req.body }, 'Received Twilio webhook callback');

    try {
        // Twilio sends different parameters than generic voice provider
        // Extract Twilio-specific fields
        const callSid = req.body.CallSid;
        const callStatus = req.body.CallStatus;
        const reminderId = req.body.reminderId; // Optional - if we pass it in statusCallback URL

        // Validate required fields
        if (!callSid) {
            logger.warn({ body: req.body }, 'Missing CallSid in webhook payload');
            return res.status(400).json({ error: 'Missing CallSid' });
        }

        if (!callStatus) {
            logger.warn({ body: req.body }, 'Missing CallStatus in webhook payload');
            return res.status(400).json({ error: 'Missing CallStatus' });
        }

        // Process the webhook (idempotent)
        const result = await reminderService.processCallWebhook({
            callSid,
            status: callStatus,
            reminderId
        });

        logger.info({ callSid, callStatus, result }, 'Twilio webhook processed successfully');

        // Twilio expects 200 OK response
        return res.status(200).send('OK');

    } catch (error) {
        logger.error({ error: error.message, stack: error.stack }, 'Webhook processing failed');

        // Still return 200 to Twilio to prevent retries for unrecoverable errors
        return res.status(200).send('Error logged');
    }
}

module.exports = {
    handleCallStatus
};
