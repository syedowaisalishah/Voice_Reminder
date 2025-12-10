const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const VAPI_BASE = process.env.VAPI_BASE_URL || 'https://api.vapi.ai';
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET || '';

/**
 * Create a voice call via VAPI
 * @param {Object} params - Call parameters
 * @param {string} params.phoneNumber - Phone number in E.164 format
 * @param {string} params.message - Message to deliver
 * @param {string} params.reminderId - Reminder ID for tracking
 * @returns {Promise<Object>} Call details with call_id and status
 */
async function createCall({ phoneNumber, message, reminderId }) {
  const payload = {
    phoneNumber: phoneNumber,
    assistant: {
      model: {
        provider: "openai",
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a friendly reminder assistant. Deliver the reminder message clearly and concisely."
          }
        ]
      },
      voice: {
        provider: "11labs",
        voiceId: "rachel"
      },
      firstMessage: message
    },
    metadata: {
      reminder_id: reminderId
    }
  };

  const headers = {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const resp = await axios.post(`${VAPI_BASE}/call`, payload, { headers });
    logger.info({ callId: resp.data.id, reminderId }, 'VAPI call created');
    return {
      call_id: resp.data.id,
      status: resp.data.status || 'created'
    };
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'VAPI createCall error');
    throw err;
  }
}

/**
 * Request transcription for a call
 * @param {string} callId - External call ID
 * @param {string} reminderId - Reminder ID
 * @returns {Promise<Object>} Transcription response
 */
async function requestTranscription(callId, reminderId) {
  const payload = {
    call_id: callId,
    metadata: { reminder_id: reminderId }
  };
  
  const headers = {
    'Authorization': `Bearer ${VAPI_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const resp = await axios.post(`${VAPI_BASE}/call/${callId}/transcript`, payload, { headers });
    logger.info({ data: resp.data }, 'VAPI transcription requested');
    return resp.data;
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'VAPI requestTranscription error');
    throw err;
  }
}

/**
 * Validate VAPI webhook signature
 * @param {Object} req - Express request object
 * @returns {boolean} True if signature is valid
 */
function validateRequest(req) {
  try {
    const sig = req.header('x-vapi-signature') || req.header('X-VAPI-Signature');
    
    // For testing, allow requests without signature if secret is not set
    if (!VAPI_WEBHOOK_SECRET) {
      logger.warn('VAPI_WEBHOOK_SECRET not set - skipping signature validation');
      return true;
    }
    
    if (!sig) {
      logger.warn('No VAPI signature header found');
      return false;
    }

    const body = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', VAPI_WEBHOOK_SECRET).update(body).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig));
  } catch (err) {
    logger.error({ err }, 'VAPI validateRequest error');
    return false;
  }
}

module.exports = {
  createCall,
  requestTranscription,
  validateRequest
};