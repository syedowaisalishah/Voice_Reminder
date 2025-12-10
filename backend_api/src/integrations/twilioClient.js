const twilio = require('twilio');
const logger = require('../utils/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

/**
 * Create an outbound call via Twilio REST API.
 * twimlUrl or twilio's instructions define the behavior during the call.
 */
async function createCall({ to, from, message, statusCallback }) {
  // We will use TwiML Bin via `twiml` param with a <Say> to play the message.
  // Alternatively host a TwiML endpoint to return instructions.
  const twiml = `<Response><Say voice="alice">${message}</Say></Response>`;
  const call = await client.calls.create({
    twiml,
    to,
    from,
    statusCallback, // Twilio will POST call events here
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST'
  });
  logger.info({ callSid: call.sid }, 'twilio call created');
  return call;
}

function validateRequest(req) {
  try {
    const signature = req.header('x-twilio-signature') || req.header('X-Twilio-Signature');
    const url = `${process.env.PUBLIC_BASE_URL || ''}${req.originalUrl}`; // must be absolute URL used to configure Twilio
    const params = req.body || {};
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (err) {
    logger.error({ err }, 'twilio validateRequest error');
    return false;
  }
}

module.exports = { createCall, validateRequest };
