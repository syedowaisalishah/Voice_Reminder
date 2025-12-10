require('dotenv').config();
const mongoose = require('mongoose');
const reminderRepository = require('./repositories/reminder.repository');
const callLogRepository = require('./repositories/calllog.repository');
const voiceProviderClient = require('./integrations/voice-provider.client');
const logger = require('./utils/logger');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/voice_reminder';

mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  logger.info('Worker: MongoDB Connected');
}).catch((err) => {
  logger.error({ err }, 'Worker: MongoDB connection failed');
  process.exit(1);
});

const POLL_SECONDS = parseInt(process.env.WORKER_POLL_INTERVAL_SECONDS || '60', 10);

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
        // Call Voice Provider API
        const call = await voiceProviderClient.createCall({
          phoneNumber: reminder.phoneNumber,
          message: reminder.message,
          reminderId: reminder.id
        });

        // Update reminder status to 'processing'
        await reminderRepository.updateReminderStatus(
          reminder.id,
          'processing',
          call.callId
        );

        // Create call log entry
        await callLogRepository.createCallLog({
          reminderId: reminder.id,
          externalCallId: call.callId,
          status: 'created',
          provider: 'voice-provider'
        });

        logger.info({
          reminderId: reminder.id,
          callId: call.callId,
          phoneNumber: reminder.phoneNumber
        }, 'Call triggered successfully');

      } catch (error) {
        logger.error({
          error: error.message,
          reminderId: reminder.id,
          stack: error.stack
        }, 'Failed to trigger call - marking reminder as failed');

        // Mark reminder as failed
        await reminderRepository.updateReminderStatus(
          reminder.id,
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
