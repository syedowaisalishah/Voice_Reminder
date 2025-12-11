require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const logger = require('./utils/logger');
const connectDB = require('./config/db');

const usersRouter = require('./routes/users');
const remindersRouter = require('./routes/reminders');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// Initialize MongoDB connection
connectDB();

// CORS middleware - allow frontend to access API
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(bodyParser.json());

// simple request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, body: req.body }, 'incoming request');
  next();
});

app.use('/api/users', usersRouter);
app.use('/api/reminders', remindersRouter);
app.use('/webhooks', webhooksRouter);

// health
app.get('/', (req, res) => res.json({ status: 'ok' }));

// error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'internal_server_error' });
});

module.exports = app;
