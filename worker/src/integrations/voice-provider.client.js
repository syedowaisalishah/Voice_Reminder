const axios = require('axios');
const logger = require('../utils/logger');

const API_BASE_URL = process.env.VOICE_PROVIDER_API_URL || 'https://voice-provider.example.com/api';
const API_KEY = process.env.VOICE_PROVIDER_API_KEY;

/**
 * Create a voice call through the Voice Provider API
 * Following the assignment's API contract
 */
async function createCall({ phoneNumber, message, reminderId }) {
    try {
        logger.info({ reminderId, phoneNumber }, 'Creating voice call');

        const response = await axios.post(
            `${API_BASE_URL}/calls`,
            {
                phone_number: phoneNumber,
                message: message,
                metadata: {
                    reminder_id: reminderId
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            }
        );

        logger.info({
            reminderId,
            callId: response.data.call_id,
            status: response.data.status
        }, 'Voice call created successfully');

        return {
            callId: response.data.call_id,
            status: response.data.status
        };

    } catch (error) {
        logger.error({
            error: error.message,
            reminderId,
            response: error.response?.data
        }, 'Failed to create voice call');

        throw new Error(`Voice Provider API error: ${error.message}`);
    }
}

module.exports = {
    createCall
};
