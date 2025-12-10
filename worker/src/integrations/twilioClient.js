const twilio = require('twilio');
const logger = require('../utils/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

/**
 * Create an outbound call via Twilio REST API.
 */
async function createCall({ to, from, message, statusCallback }) {
  const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
  const call = await client.calls.create({
    twiml,
    to,
    from,
    statusCallback,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST'
  });
  logger.info({ callSid: call.sid }, 'twilio call created');
  return call;
}

module.exports = { createCall };
