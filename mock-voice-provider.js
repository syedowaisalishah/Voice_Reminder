const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

console.log('🎭 Mock Voice Provider API Starting...');

// Mock create call endpoint
app.post('/api/calls', (req, res) => {
    const { phone_number, message, metadata } = req.body;

    // Validate request
    if (!phone_number || !message || !metadata?.reminder_id) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['phone_number', 'message', 'metadata.reminder_id']
        });
    }

    const callId = `mock-call-${Date.now()}`;

    console.log('✅ Mock call created:', {
        callId,
        phone_number,
        message: message.substring(0, 50) + '...',
        reminder_id: metadata.reminder_id
    });

    // Simulate webhook callback after 5 seconds
    setTimeout(async () => {
        const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:4000/webhooks/call-status';

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    call_id: callId,
                    status: 'completed', // or 'failed' randomly
                    metadata,
                    transcript: `AI said: ${message}`
                })
            });

            if (response.ok) {
                console.log('📞 Webhook sent successfully for call:', callId);
            } else {
                console.error('⚠️ Webhook failed:', response.status, response.statusText);
            }
        } catch (err) {
            console.error('❌ Webhook error:', err.message);
        }
    }, 5000);

    // Return response immediately
    res.status(201).json({
        call_id: callId,
        status: 'created'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'mock-voice-provider',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Mock Voice Provider running on http://localhost:${PORT}`);
    console.log(`📋 API endpoint: http://localhost:${PORT}/api/calls`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Configuration:');
    console.log(`  Webhook URL: ${process.env.WEBHOOK_URL || 'http://localhost:4000/webhooks/call-status'}`);
    console.log('');
    console.log('To use this mock:');
    console.log('  1. Update worker .env:');
    console.log('     VOICE_PROVIDER_API_URL=http://localhost:3002/api');
    console.log('     VOICE_PROVIDER_API_KEY=mock-key');
    console.log('  2. Run worker and webhook server');
    console.log('  3. Create a reminder with scheduled time in the past');
    console.log('  4. Watch the logs!');
});
