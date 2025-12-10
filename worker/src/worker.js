require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilioClient = require('../integrations/twilio.client');
const logger = require('../utils/logger');

const POLL_SECONDS = parseInt(process.env.WORKER_POLL_INTERVAL_SECONDS || '60', 10);

async function processDueReminders() {
  logger.info('Worker tick: checking due reminders');

  try {
    const now = new Date();

    const dueReminders = await prisma.reminder.findMany({
      where: {
        scheduledAt: { lte: now },
        status: 'scheduled'
      },
      take: 50
    });

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
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            twilioCallSid: call.sid,
            status: "processing"
          }
        });

        // Insert call log
        await prisma.callLog.create({
          data: {
            reminderId: reminder.id,
            externalCallId: call.sid,
            provider: "twilio",
            status: "created"
          }
        });

        logger.info({
          reminderId: reminder.id,
          callSid: call.sid
        }, "Triggered Twilio call");

      } catch (error) {
        logger.error({
          error,
          reminderId: reminder.id
        }, "Error triggering Twilio call — marking as failed");

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "failed" }
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
