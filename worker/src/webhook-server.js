require('dotenv').config();
const express = require('express');
const webhookController = require('./controllers/webhook.controller');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 4000;

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info({ 
    method: req.method, 
    path: req.path,
    query: req.query 
  }, 'Incoming request');
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'voice-reminder-worker-webhook',
    timestamp: new Date().toISOString()
  });
});

app.post('/webhooks/call-status', webhookController.handleCallStatus);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Webhook server started');
  logger.info(`Webhook endpoint: http://localhost:${PORT}/webhooks/call-status`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
