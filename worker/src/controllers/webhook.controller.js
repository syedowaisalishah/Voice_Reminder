const reminderService = require('../services/reminder.service');
const logger = require('../utils/logger');

/**
 * Handle incoming webhook callback from Voice Provider
 * POST /webhooks/call-status
 */
async function handleCallStatus(req, res) {
    logger.info({ body: req.body }, 'Received webhook callback');

    try {
        const { call_id, status, metadata, transcript } = req.body;

        // Validate required fields
        if (!call_id) {
            logger.warn({ body: req.body }, 'Missing call_id in webhook payload');
            return res.status(400).json({ error: 'Missing call_id' });
        }

        if (!status) {
            logger.warn({ body: req.body }, 'Missing status in webhook payload');
            return res.status(400).json({ error: 'Missing status' });
        }

        if (!metadata || !metadata.reminder_id) {
            logger.warn({ body: req.body }, 'Missing metadata.reminder_id in webhook payload');
            return res.status(400).json({ error: 'Missing metadata.reminder_id' });
        }

        const reminderId = metadata.reminder_id;

        // Process the webhook (idempotent)
        const result = await reminderService.processCallWebhook({
            reminderId,
            externalCallId: call_id,
            status,
            transcript: transcript || null
        });

        logger.info({ reminderId, status, result }, 'Webhook processed successfully');

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        logger.error({ error: error.message, stack: error.stack }, 'Webhook processing failed');

        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

module.exports = {
    handleCallStatus
};
