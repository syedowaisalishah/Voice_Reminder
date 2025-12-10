require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const connectDB = require('./config/db');

const usersRouter = require('./routes/users');
const remindersRouter = require('./routes/reminders');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// Initialize MongoDB connection
connectDB();

app.use(bodyParser.json());

// simple request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, body: req.body }, 'incoming request');
  next();
});

app.use('/users', usersRouter);
app.use('/reminders', remindersRouter);
app.use('/webhooks', webhooksRouter);

// health
app.get('/', (req, res) => res.json({ status: 'ok' }));

// error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'internal_server_error' });
});

module.exports = app;
