const Reminder = require('../models/reminder.model');
const CallLog = require('../models/calllog.model');
const logger = require('../utils/logger');
const twilioClient = require('../integrations/twilioClient');
const vapiClient = require('../integrations/vapiClient');

// Idempotency approach: check call_logs table for existing externalCallId + provider

module.exports = {
  async handleTwilio(req, res, next) {
    try {
      // Twilio signature validation
      const valid = twilioClient.validateRequest(req);
      if (!valid) {
        logger.warn('Invalid twilio signature');
        return res.status(403).send('invalid signature');
      }
      const { CallSid, CallStatus } = req.body;
      logger.info({ CallSid, CallStatus }, 'twilio webhook received');

      // Find reminder by twilioCallSid
      const callLogsExisting = await CallLog.find({
        externalCallId: CallSid,
        provider: 'twilio'
      });

      // create call log if not exists
      if (callLogsExisting.length === 0) {
        // First find the reminder by twilioCallSid
        const reminder = await Reminder.findOne({ twilioCallSid: CallSid });
        
        if (reminder) {
          try {
            await CallLog.create({
              reminderId: reminder._id,
              externalCallId: CallSid,
              provider: 'twilio',
              status: CallStatus
            });
          } catch (err) {
            // Handle duplicate key error (idempotency)
            if (err.code !== 11000) {
              logger.error({ err }, 'calllog create error');
            }
          }
        } else {
          logger.warn({ CallSid }, 'could not map twilio CallSid to reminder');
        }
      } else {
        logger.info({ CallSid }, 'twilio calllog already exists — idempotent');
      }

      // Update reminder status when call completes or fails
      if (CallStatus === 'completed' || CallStatus === 'in-progress' || CallStatus === 'failed') {
        const reminder = await Reminder.findOne({ twilioCallSid: CallSid });
        if (reminder) {
          // If completed, let VAPI produce transcript; still update status or leave as processing and wait for vapi
          if (CallStatus === 'failed') {
            await Reminder.findByIdAndUpdate(reminder._id, { status: 'failed' });
          } else if (CallStatus === 'completed') {
            // keep status as processing until vapi webhook provides transcript, or optionally mark interim status
            await Reminder.findByIdAndUpdate(reminder._id, { status: 'processing' });
            // Optionally call VAPI to request transcript if not auto-triggered
            // vapiClient.requestTranscription(CallSid, reminder._id).catch(e => logger.error({ e }));
          }
        } else {
          logger.warn({ CallSid }, 'twilio callback: reminder not found for CallSid');
        }
      }

      res.status(200).send('ok');
    } catch (err) {
      logger.error({ err }, 'handleTwilio error');
      next(err);
    }
  },

  async handleVapi(req, res, next) {
    try {
      // Validate VAPI webhook signature
      const valid = vapiClient.validateRequest(req);
      if (!valid) {
        logger.warn('Invalid VAPI webhook signature');
        return res.status(403).send('invalid signature');
      }
      const { call_id, status, metadata, transcript } = req.body;
      logger.info({ call_id, status }, 'vapi webhook received');

      // idempotency: check call_log for provider vapi & externalCallId
      const existing = await CallLog.findOne({
        externalCallId: call_id,
        provider: 'vapi'
      });

      if (existing) {
        logger.info({ call_id }, 'vapi webhook duplicate, ignoring');
        return res.status(200).send('duplicate');
      }

      // Map reminder either from metadata.reminder_id or from twilioCallSid === call_id
      let reminder = null;
      if (metadata && metadata.reminder_id) {
        reminder = await Reminder.findById(metadata.reminder_id);
      }
      if (!reminder) {
        // maybe call_id is Twilio SID
        reminder = await Reminder.findOne({ twilioCallSid: call_id });
      }

      if (!reminder) {
        logger.warn({ call_id }, 'vapi callback: reminder not found');
        return res.status(200).send('ok');
      }

      // insert call log
      try {
        await CallLog.create({
          reminderId: reminder._id,
          externalCallId: call_id,
          provider: 'vapi',
          status,
          transcript
        });
      } catch (err) {
        // Handle duplicate key error (idempotency)
        if (err.code === 11000) {
          logger.info({ call_id }, 'vapi calllog already exists');
          return res.status(200).send('ok');
        }
        throw err;
      }

      // update reminder final status -> called if status indicates success
      if (status === 'completed' || status === 'transcribed') {
        await Reminder.findByIdAndUpdate(reminder._id, { status: 'called' });
      } else {
        await Reminder.findByIdAndUpdate(reminder._id, { status: 'failed' });
      }

      res.status(200).send('ok');
    } catch (err) {
      logger.error({ err }, 'handleVapi error');
      next(err);
    }
  }
};
