require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('./config/db');
const reminderRepository = require('./repositories/reminder.repository');
const callLogRepository = require('./repositories/calllog.repository');
const twilioClient = require('./integrations/twilioClient');
const logger = require('./utils/logger');

const POLL_SECONDS = parseInt(process.env.WORKER_POLL_INTERVAL_SECONDS || '60', 10);
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:4000';

/**
 * Process due reminders - main worker function
 */
async function processDueReminders() {
  logger.info('Worker tick: checking due reminders');

  try {
    // Get due reminders from repository
    const dueReminders = await reminderRepository.getDueReminders(50);
    
    logger.info({ count: dueReminders.length }, 'Found due reminders');

    // Process each reminder
    for (const reminder of dueReminders) {
      try {
        // Validate Twilio configuration
        if (!TWILIO_FROM_NUMBER) {
          logger.error('TWILIO_FROM_NUMBER not configured');
          continue;
        }

        // Create Twilio call
        const statusCallback = `${WEBHOOK_BASE_URL}/webhooks/call-status`;
        
        const call = await twilioClient.createCall({
          to: reminder.phoneNumber,
          from: TWILIO_FROM_NUMBER,
          message: reminder.message,
          statusCallback
        });

        // Update reminder status to 'processing'
        await reminderRepository.updateReminderStatus(
          reminder._id.toString(),
          'processing',
          call.sid
        );

        // Create call log entry
        await callLogRepository.createCallLog({
          reminderId: reminder._id.toString(),
          externalCallId: call.sid,
          status: 'initiated',
          provider: 'twilio'
        });

        logger.info({
          reminderId: reminder._id.toString(),
          callSid: call.sid,
          phoneNumber: reminder.phoneNumber
        }, 'Twilio call triggered successfully');

      } catch (error) {
        logger.error({
          error: error.message,
          reminderId: reminder._id.toString(),
          stack: error.stack
        }, 'Failed to trigger call - marking reminder as failed');

        // Mark reminder as failed
        await reminderRepository.updateReminderStatus(
          reminder._id.toString(),
          'failed'
        );
      }
    }

  } catch (error) {
    logger.error({ 
      error: error.message,
      stack: error.stack 
    }, 'Worker tick failed');
  }
}

/**
 * Start the worker
 */
(async function run() {
  logger.info('Voice Reminder Worker starting...');
  logger.info({ pollIntervalSeconds: POLL_SECONDS }, 'Worker configuration');

  // Connect to MongoDB first
  await connectDB();

  // Run immediately on startup
  await processDueReminders();

  // Then run on interval
  setInterval(processDueReminders, POLL_SECONDS * 1000);

  logger.info('Worker is now running and polling for due reminders');
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
