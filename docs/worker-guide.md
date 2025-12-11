# Worker Implementation Guide

## Overview
The Worker / Integration Service is responsible for:
1. **Polling**: Periodically checking for due reminders
2. **Integration**: Triggering voice calls via external Voice Provider API
3. **Webhooks**: Processing call status callbacks
4. **Logging**: Recording all operations and errors

---

## Current Structure

```
worker/
├── Dockerfile
├── package.json (already configured)
├── .env.example
└── src/
    ├── worker.js (main worker loop)
    ├── config/
    │   └── (configuration files)
    ├── integrations/
    │   └── (Voice Provider client - currently Twilio)
    ├── repositories/
    │   └── (database access layer)
    └── services/
        └── (business logic)
```

**Current Status**: Worker is already partially implemented with Twilio integration.

---

## 1. Current Implementation Analysis

### Existing Code (`worker.js`):

✅ **Already Implemented**:
- Polling mechanism using `setInterval`
- Database query for due reminders
- Twilio call triggering
- Status updates to `processing`
- Call log creation
- Error handling with status update to `failed`
- Structured logging with Pino

⚠️ **Needs Enhancement**:
- Webhook endpoint for receiving call status updates
- Idempotent webhook processing
- More robust retry logic
- Better separation of concerns

---

## 2. Architecture Overview

```mermaid
graph TB
    A[Worker Loop] -->|Every 60s| B[Query Due Reminders]
    B --> C[For Each Reminder]
    C --> D[Call Voice Provider API]
    D -->|Success| E[Update Status: processing]
    D -->|Error| F[Update Status: failed]
    E --> G[Create Call Log]
    
    H[Voice Provider] -->|Webhook| I[/webhooks/call-status]
    I --> J[Validate Payload]
    J --> K[Find Reminder by metadata.reminder_id]
    K --> L{Status?}
    L -->|completed| M[Update Status: called]
    L -->|failed| N[Update Status: failed]
    M --> O[Update Call Log with Transcript]
    N --> O
```

---

## 3. Required Components

### 3.1 Worker Service (Polling)

**File**: `src/worker.js` (already exists)

**Current Implementation**:
```javascript
// Already implemented - polls every 60 seconds
async function processDueReminders() {
  const dueReminders = await prisma.reminder.findMany({
    where: {
      scheduledAt: { lte: now },
      status: 'scheduled'
    },
    take: 50
  });
  
  for (const reminder of dueReminders) {
    // Trigger call
    // Update status
    // Log
  }
}
```

**Enhancement Needed**: Add retry logic for failed calls

### 3.2 Webhook Server

**File**: `src/webhook-server.js` (needs to be created)

**Purpose**: Express server to handle webhook callbacks

**Implementation**:

```javascript
const express = require('express');
const app = express();
const webhookController = require('./controllers/webhook.controller');
const logger = require('./utils/logger');

app.use(express.json());

// Webhook endpoint
app.post('/webhooks/call-status', webhookController.handleCallStatus);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.WEBHOOK_PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Webhook server listening on port ${PORT}`);
});
```

### 3.3 Webhook Controller

**File**: `src/controllers/webhook.controller.js` (needs to be created)

**Purpose**: Process incoming webhook callbacks

**Key Features**:
- Validate webhook payload
- Extract `reminder_id` from metadata
- Update reminder status (called/failed)
- Update call log with transcript
- **Idempotent processing** (handle duplicate webhooks)

**Implementation**:

```javascript
const reminderService = require('../services/reminder.service');
const logger = require('../utils/logger');

async function handleCallStatus(req, res) {
  logger.info({ body: req.body }, 'Received webhook callback');
  
  try {
    const { call_id, status, metadata, transcript } = req.body;
    
    // Validate payload
    if (!call_id || !status || !metadata?.reminder_id) {
      logger.warn('Invalid webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }
    
    const reminderId = metadata.reminder_id;
    
    // Process webhook (idempotent)
    await reminderService.processCallWebhook({
      reminderId,
      externalCallId: call_id,
      status,
      transcript
    });
    
    logger.info({ reminderId, status }, 'Webhook processed successfully');
    return res.status(200).json({ success: true });
    
  } catch (error) {
    logger.error({ error }, 'Webhook processing failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleCallStatus };
```

### 3.4 Reminder Service

**File**: `src/services/reminder.service.js` (needs to be created)

**Purpose**: Business logic for reminder operations

**Key Function**:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Process call webhook (idempotent)
 */
async function processCallWebhook({ reminderId, externalCallId, status, transcript }) {
  // Check if already processed (idempotency)
  const existingLog = await prisma.callLog.findFirst({
    where: {
      reminderId,
      externalCallId,
      status: { in: ['completed', 'failed'] }
    }
  });
  
  if (existingLog) {
    logger.info({ reminderId }, 'Webhook already processed (idempotent check)');
    return;
  }
  
  // Map provider status to our status
  const reminderStatus = (status === 'completed') ? 'called' : 'failed';
  
  // Update reminder status
  await prisma.reminder.update({
    where: { id: reminderId },
    data: { status: reminderStatus }
  });
  
  // Update call log
  await prisma.callLog.updateMany({
    where: {
      reminderId,
      externalCallId
    },
    data: {
      status,
      transcript,
      receivedAt: new Date()
    }
  });
  
  logger.info({ reminderId, status: reminderStatus }, 'Reminder status updated');
}

module.exports = {
  processCallWebhook
};
```

---

## 4. Voice Provider Integration

### Current: Twilio

**File**: `src/integrations/twilio.client.js` (likely already exists)

### Generic Voice Provider

For the assignment, you may need a generic Voice Provider client:

**File**: `src/integrations/voice-provider.client.js`

```javascript
const axios = require('axios');
const logger = require('../utils/logger');

const API_BASE_URL = process.env.VOICE_PROVIDER_API_URL || 'https://voice-provider.example.com/api';
const API_KEY = process.env.VOICE_PROVIDER_API_KEY;

async function createCall({ phoneNumber, message, reminderId }) {
  try {
    const response = await axios.post(`${API_BASE_URL}/calls`, {
      phone_number: phoneNumber,
      message: message,
      metadata: {
        reminder_id: reminderId
      }
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    logger.info({ reminderId, callId: response.data.call_id }, 'Voice call created');
    
    return {
      callId: response.data.call_id,
      status: response.data.status
    };
    
  } catch (error) {
    logger.error({ error, reminderId }, 'Failed to create voice call');
    throw error;
  }
}

module.exports = { createCall };
```

---

## 5. Configuration

### Environment Variables (`.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Worker Configuration
WORKER_POLL_INTERVAL_SECONDS=60
WEBHOOK_PORT=4000

# Voice Provider (Generic)
VOICE_PROVIDER_API_URL=https://voice-provider.example.com/api
VOICE_PROVIDER_API_KEY=your-api-key-here
PUBLIC_BASE_URL=https://your-worker-url.com

# OR Twilio (if using Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

---

## 6. Separation of Concerns

### Repository Layer

**File**: `src/repositories/reminder.repository.js`

**Purpose**: Database access only (no business logic)

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDueReminders(limit = 50) {
  return prisma.reminder.findMany({
    where: {
      scheduledAt: { lte: new Date() },
      status: 'scheduled'
    },
    take: limit
  });
}

async function updateReminderStatus(id, status, externalCallId = null) {
  return prisma.reminder.update({
    where: { id },
    data: { 
      status,
      ...(externalCallId && { externalCallId })
    }
  });
}

module.exports = {
  findDueReminders,
  updateReminderStatus
};
```

---

## 7. Implementation Steps

### Step 1: Enhance Existing Worker

1. Review current `worker.js` implementation
2. Ensure proper error handling
3. Add retry logic for failed calls (optional but recommended)

### Step 2: Create Webhook Server

1. Create `src/webhook-server.js`
2. Set up Express server
3. Add webhook endpoint
4. Add health check endpoint

### Step 3: Implement Webhook Processing

1. Create `src/controllers/webhook.controller.js`
2. Implement `handleCallStatus` function
3. Add payload validation
4. Handle errors gracefully

### Step 4: Create Reminder Service

1. Create `src/services/reminder.service.js`
2. Implement `processCallWebhook` with idempotency
3. Add status mapping logic
4. Update reminder and call log

### Step 5: Repository Layer (Optional but Recommended)

1. Create `src/repositories/reminder.repository.js`
2. Extract database queries from services
3. Create `src/repositories/call-log.repository.js` for call log operations

### Step 6: Integration Layer

1. Review existing Twilio client or create generic Voice Provider client
2. Ensure it matches the assignment's API contract
3. Add proper error handling and logging

### Step 7: Testing

1. Test worker polling mechanism
2. Test call triggering
3. Test webhook endpoint with sample payloads
4. Test idempotency (send duplicate webhooks)
5. Test error scenarios

---

## 8. Running the Worker

### Package.json Scripts

Update `package.json`:

```json
{
  "scripts": {
    "start": "node src/worker.js",
    "webhook": "node src/webhook-server.js",
    "dev": "concurrently \"npm run start\" \"npm run webhook\""
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.3",
    "express": "^4.18.0",
    "pino": "^8.12.0"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "prisma": "^5.0.0"
  }
}
```

### Running Locally

```bash
# Install dependencies
npm install

# Run worker and webhook server together
npm run dev

# Or run separately
npm run start    # Worker polling
npm run webhook  # Webhook server
```

---

## 9. Logging Best Practices

Use structured logging with Pino (already implemented):

```javascript
const logger = require('./utils/logger');

// Info logs
logger.info({ reminderId, callId }, 'Call triggered successfully');

// Error logs
logger.error({ error, reminderId }, 'Failed to trigger call');

// Debug logs
logger.debug({ count: dueReminders.length }, 'Found due reminders');
```

---

## 10. Error Handling & Retry Logic

### Basic Retry for Failed Calls (Optional Enhancement)

```javascript
async function triggerCallWithRetry(reminder, maxRetries = 3) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const call = await voiceProviderClient.createCall({
        phoneNumber: reminder.phoneNumber,
        message: reminder.message,
        reminderId: reminder.id
      });
      
      return call; // Success
      
    } catch (error) {
      attempts++;
      logger.warn({ reminderId: reminder.id, attempts }, 'Call failed, retrying...');
      
      if (attempts >= maxRetries) {
        throw error; // Max retries reached
      }
      
      await sleep(1000 * attempts); // Exponential backoff
    }
  }
}
```

---

## 11. Deployment

### Docker Setup

The `Dockerfile` should already exist. Ensure it:
- Installs dependencies
- Copies source code
- Runs both worker and webhook server

### Environment Configuration

For deployment platforms (Render, Railway, Fly.io):
1. Set environment variables
2. Ensure `PUBLIC_BASE_URL` points to the deployed webhook server
3. Configure database connection string
4. Deploy as a background worker service

---

## 12. Testing Checklist

- [ ] Worker starts successfully
- [ ] Worker polls database every 60 seconds
- [ ] Due reminders are detected correctly
- [ ] Voice Provider API is called with correct payload
- [ ] Reminder status updates to `processing`
- [ ] Call log is created
- [ ] Error handling works (network failures, API errors)
- [ ] Webhook server starts successfully
- [ ] Webhook endpoint receives POST requests
- [ ] Webhook payload validation works
- [ ] Reminder status updates to `called` on success
- [ ] Reminder status updates to `failed` on failure
- [ ] Call log updates with transcript
- [ ] Idempotency check prevents duplicate processing
- [ ] Logs are readable and informative

---

## 13. Key Differences from Backend API

| Aspect | Backend API | Worker |
|--------|------------|--------|
| **Purpose** | Handle user requests | Process scheduled tasks |
| **Trigger** | HTTP requests | Time-based (polling) |
| **Endpoints** | REST API for CRUD | Webhook endpoint only |
| **Database** | Read/Write (user-initiated) | Read/Write (automated) |
| **Integration** | None | External Voice Provider API |
| **Running** | Web server (always listening) | Background process + webhook server |

---

## Summary

The Worker is responsible for:
1. **Polling**: Check for due reminders every 60 seconds (configurable)
2. **Triggering Calls**: Call Voice Provider API when reminders are due
3. **Webhooks**: Listen for call status updates and process them idempotently
4. **Logging**: Record all operations for observability

**Key Technologies**: Node.js, Prisma, Express (for webhooks), Pino (logging), Axios (HTTP client)

**Separation of Concerns**:
- `worker.js`: Polling and orchestration
- `webhook-server.js`: HTTP server for webhooks
- `controllers/`: Handle HTTP requests
- `services/`: Business logic (idempotency, status mapping)
- `repositories/`: Database access
- `integrations/`: External API clients

Focus on **robust error handling**, **idempotent webhook processing**, and **clear logging** for observability.
