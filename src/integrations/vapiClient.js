const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const VAPI_BASE = process.env.VAPI_BASE_URL;
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_TRANSCRIBE_ENDPOINT = process.env.VAPI_TRANSCRIBE_ENDPOINT || `${VAPI_BASE}/api/transcribe`;
const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || '';

async function requestTranscription(callId, reminderId) {
  // Use API key if required
  const payload = {
    call_id: callId,
    metadata: { reminder_id: reminderId }
  };
  const headers = { 'Authorization': `Bearer ${VAPI_API_KEY}` };
  try {
    const resp = await axios.post(VAPI_TRANSCRIBE_ENDPOINT, payload, { headers });
    logger.info({ data: resp.data }, 'vapi transcription requested');
    return resp.data;
  } catch (err) {
    logger.error({ err }, 'vapi requestTranscription error');
    throw err;
  }
}

function validateRequest(req) {
  // Expect header X-VAPI-Signature with HMAC-SHA256 of body using VAPI_WEBHOOK_SECRET
  try {
    const sig = req.header('x-vapi-signature') || req.header('X-VAPI-Signature');
    if (!sig || !VAPI_WEBHOOK_SECRET) return false;
    const body = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', VAPI_WEBHOOK_SECRET).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig));
  } catch (err) {
    logger.error({ err }, 'vapi validateRequest error');
    return false;
  }
}

module.exports = { requestTranscription, validateRequest };
