const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

module.exports = {
  initiateCall: async (to, message, reminder_id) => {
    return await client.calls.create({
      to,
      from: process.env.TWILIO_PHONE,
      url: `${process.env.BACKEND_URL}/twilio/voice?message=${encodeURIComponent(message)}`,
      statusCallback: `${process.env.BACKEND_URL}/webhooks/twilio-status`,
      statusCallbackEvent: ['completed', 'failed'],
      statusCallbackMethod: 'POST'
    });
  }
};
