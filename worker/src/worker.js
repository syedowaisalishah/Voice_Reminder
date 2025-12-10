require('dotenv').config();
const mongoose = require('mongoose');
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

// Import models - they need to be defined in worker or shared
const Reminder = require('./models/reminder.model');
const CallLog = require('./models/calllog.model');
const twilioClient = require('./integrations/twilioClient');


const POLL_SECONDS = parseInt(process.env.WORKER_POLL_INTERVAL_SECONDS || '60', 10);

async function processDueReminders() {
  logger.info('Worker tick: checking due reminders');

  try {
    const now = new Date();

    const dueReminders = await Reminder.find({
      scheduledAt: { $lte: now },
      status: 'scheduled'
    }).limit(50);

    logger.info({ count: dueReminders.length }, "Found due reminders");

    for (const reminder of dueReminders) {
      try {
        const call = await twilioClient.createCall({
          to: reminder.phoneNumber,
          from: process.env.TWILIO_FROM_NUMBER,
          message: reminder.message,
          statusCallback: `${process.env.PUBLIC_BASE_URL}/webhooks/twilio`
        });

        // Update reminder
        await Reminder.findByIdAndUpdate(reminder._id, {
          twilioCallSid: call.sid,
          status: "processing"
        });

        // Insert call log
        await CallLog.create({
          reminderId: reminder._id,
          externalCallId: call.sid,
          provider: "twilio",
          status: "created"
        });

        logger.info({
          reminderId: reminder._id,
          callSid: call.sid
        }, "Triggered Twilio call");

      } catch (error) {
        logger.error({
          error,
          reminderId: reminder._id
        }, "Error triggering Twilio call — marking as failed");

        await Reminder.findByIdAndUpdate(reminder._id, {
          status: "failed"
        });
      }
    }

  } catch (error) {
    logger.error({ error }, "Worker tick failed");
  }
}

(async function run() {
  logger.info("Worker started");
  await processDueReminders(); // run immediately
  setInterval(processDueReminders, POLL_SECONDS * 1000);
})();
