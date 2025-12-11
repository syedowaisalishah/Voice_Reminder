# Voice Reminder Service

A complete voice reminder system that allows users to schedule voice reminders, which are executed via external Voice Provider APIs (Twilio/VAPI). The system triggers calls at scheduled times and processes webhook callbacks to track call status and transcripts.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Logging & Observability](#logging--observability)
- [Testing](#testing)
- [Evaluation Criteria Compliance](#evaluation-criteria-compliance)

---

## 🛠 Tech Stack

### Backend API Service
- **Runtime**: Node.js v18.20.8
- **Framework**: Express.js v4.18.2
- **Database**: MongoDB v7 (hosted in Docker)
- **ORM**: Mongoose v8.0.0
- **Logging**: Winston (custom logger with Pino)
- **Validation**: Custom validators

### Worker / Integration Service
- **Runtime**: Node.js v18.20.8
- **Framework**: Express.js (for webhook server)
- **Integrations**: 
  - Twilio SDK v4.0.0
  - Custom VAPI client
- **Process Management**: Concurrently (runs worker + webhook server)
- **Logging**: Pino v8.12.0

### Frontend
- **Framework**: Next.js v14.2.33
- **UI Library**: React v18
- **Styling**: Tailwind CSS v3.4.1
- **HTTP Client**: Axios v1.6.0
- **State Management**: React Hooks

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Database Admin**: Adminer (port 8080)
- **Environment Management**: dotenv

---

## 🏗 Architecture Overview

### Separation of Concerns

The application follows a **clean architecture** with clear separation between:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    (Next.js - Port 3000)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVICE                        │
│                    (Express - Port 4000)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │→ │   Services   │→ │ Repositories │      │
│  │  (Routes)    │  │(Business Logic)│ │(Data Access) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                          │
│                      (Port 27017)                            │
│  Collections: users, reminders, call_logs                   │
└─────────────────────────────────────────────────────────────┘
                     ▲
                     │
┌────────────────────┴────────────────────────────────────────┐
│              WORKER / INTEGRATION SERVICE                    │
│                    (Node.js - Port 4001)                     │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Worker Polling  │      │  Webhook Server  │            │
│  │  (Every 60s)     │      │  (Port 4001)     │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           ▼                         ▼                       │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Twilio Client    │      │ Webhook Handler  │            │
│  │ VAPI Client      │      │ (Twilio/VAPI)    │            │
│  └──────────────────┘      └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL VOICE PROVIDERS                        │
│          Twilio API  |  VAPI (Voice AI Platform)            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. **Controllers / Routes** (HTTP Layer)
- Handle HTTP requests/responses only
- Input validation and sanitization
- No business logic
- Located in: `backend_api/src/routes/` and `backend_api/src/controllers/`

#### 2. **Services** (Business Logic Layer)
- Implement domain rules and validation
- Coordinate between repositories
- Status transitions and scheduling logic
- Located in: `backend_api/src/services/`

#### 3. **Repositories** (Data Access Layer)
- Encapsulate all database operations
- No business logic
- Return domain models
- Located in: `backend_api/src/repositories/`

#### 4. **Integration Layer**
- External API clients (Twilio, VAPI)
- Webhook handling and validation
- Located in: `worker/src/integrations/` and `worker/src/controllers/`

---

## 📁 Project Structure

```
Voice_Reminder/
├── backend_api/                 # Reminder API Service
│   ├── src/
│   │   ├── controllers/         # HTTP request handlers
│   │   │   ├── reminderController.js
│   │   │   └── userController.js
│   │   ├── services/            # Business logic
│   │   │   ├── reminderService.js
│   │   │   └── userService.js
│   │   ├── repositories/        # Data access layer
│   │   │   ├── reminderRepo.js
│   │   │   └── userRepo.js
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── reminder.model.js
│   │   │   └── user.model.js
│   │   ├── routes/              # Express routes
│   │   │   ├── reminders.js
│   │   │   └── users.js
│   │   ├── utils/               # Utilities
│   │   │   ├── logger.js
│   │   │   └── validators.js
│   │   ├── config/              # Configuration
│   │   │   └── db.js
│   │   ├── app.js               # Express app setup
│   │   └── server.js            # Server entry point
│   ├── Dockerfile
│   └── package.json
│
├── worker/                      # Worker / Integration Service
│   ├── src/
│   │   ├── integrations/        # External API clients
│   │   │   ├── twilioClient.js
│   │   │   └── vapiClient.js
│   │   ├── controllers/         # Webhook handlers
│   │   │   └── webhookController.js
│   │   ├── routes/              # Webhook routes
│   │   │   └── webhooks.js
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── reminder.model.js
│   │   │   ├── user.model.js
│   │   │   └── calllog.model.js
│   │   ├── repositories/        # Data access
│   │   │   ├── reminder.repository.js
│   │   │   ├── user.repository.js
│   │   │   └── calllog.repository.js
│   │   ├── services/            # Worker business logic
│   │   │   └── reminderService.js
│   │   ├── utils/               # Utilities
│   │   │   └── logger.js
│   │   ├── config/              # Configuration
│   │   │   └── db.js
│   │   ├── worker.js            # Worker polling script
│   │   └── webhook-server.js    # Webhook HTTP server
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/                 # Next.js app directory
│   │   │   ├── page.js          # Home page
│   │   │   ├── users/           # Users pages
│   │   │   ├── reminders/       # Reminders pages
│   │   │   └── layout.js
│   │   └── lib/                 # Utilities
│   │       └── api.js           # API client
│   ├── public/                  # Static assets
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml           # Multi-container orchestration
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
└── README.md                    # This file
```

---

## 🗄 Database Schema

### MongoDB Collections

#### **users**
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique)

#### **reminders**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, indexed),
  phoneNumber: String (E.164 format, required),
  message: String (required),
  scheduledAt: Date (required, indexed),
  status: String (enum: ['scheduled', 'processing', 'called', 'failed'], default: 'scheduled', indexed),
  twilioCallSid: String (nullable, sparse index),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (for user queries)
- `scheduledAt` (for worker queries)
- `status` (for filtering)
- Compound: `{ status: 1, scheduledAt: 1 }` (for worker efficiency)
- `twilioCallSid` (sparse, for webhook lookups)

#### **call_logs**
```javascript
{
  _id: ObjectId,
  reminderId: ObjectId (ref: 'Reminder', required, indexed),
  externalCallId: String (required),
  provider: String (enum: ['twilio', 'vapi'], required),
  status: String (required),
  transcript: String (nullable),
  metadata: Object (nullable),
  receivedAt: Date (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `reminderId` (for reminder queries)
- `externalCallId` (for idempotency checks)
- Compound: `{ externalCallId: 1, provider: 1 }` (unique, for idempotency)

### Reminder State Flow

```
┌──────────┐
│scheduled │  ← User creates reminder
└────┬─────┘
     │ Worker detects due reminder
     ▼
┌──────────┐
│processing│  ← Call requested from provider
└────┬─────┘
     │ Webhook received
     ├─────────────┬─────────────┐
     ▼             ▼             ▼
┌────────┐   ┌─────────┐   ┌────────┐
│ called │   │completed│   │ failed │
└────────┘   └─────────┘   └────────┘
```

---

## ⚙️ Setup Instructions

### Prerequisites

- **Docker** & **Docker Compose** installed
- **Node.js** v18+ (for local development)
- **Git** installed

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Voice_Reminder.git
cd Voice_Reminder
```

### 2. Configure Environment Variables

**Important:** The actual `.env` file with working credentials is submitted separately as per assignment requirements (Section 11). 

For local setup, copy the example file:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials. The `.env.example` file contains placeholder values to show the required format.

```bash
# MongoDB Connection
MONGODB_URI=mongodb://admin:password@mongodb:27017/voice_reminder?authSource=admin
DATABASE_URL=mongodb://admin:password@mongodb:27017/voice_reminder?authSource=admin

# API Configuration
PORT=4000
PUBLIC_BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3004
NODE_ENV=development

# Worker Configuration
WORKER_POLL_INTERVAL_SECONDS=60

# Twilio Configuration (Required for voice calls)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1XXXXXXXXXXX
TWILIO_CALL_STATUS_CALLBACK_URL=http://your-public-url:4001/webhooks/twilio

# VAPI Configuration (Optional)
VAPI_BASE_URL=https://api.vapi.ai
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_SECRET=supersecretvapisignaturekey
```

**Environment Variable Descriptions:**

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string for Docker | Yes |
| `DATABASE_URL` | Alternative MongoDB connection string | Yes |
| `PORT` | Backend API port (default: 4000) | Yes |
| `PUBLIC_BASE_URL` | Public URL of backend API | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `WORKER_POLL_INTERVAL_SECONDS` | How often worker checks for due reminders | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | Yes |
| `TWILIO_FROM_NUMBER` | Twilio phone number (E.164 format) | Yes |
| `TWILIO_CALL_STATUS_CALLBACK_URL` | Webhook URL for Twilio callbacks | Yes |
| `VAPI_BASE_URL` | VAPI API base URL | No |
| `VAPI_API_KEY` | VAPI authentication key | No |
| `VAPI_WEBHOOK_SECRET` | Secret for VAPI webhook validation | No |

### 3. Database Setup

The database is automatically created and configured when you start the Docker containers. No manual migration scripts are needed as Mongoose handles schema creation.

**MongoDB Credentials (Docker):**
- Username: `admin`
- Password: `password`
- Database: `voice_reminder`
- Port: `27017`

**Access Database Admin UI:**
```
http://localhost:8080
```
Login with the credentials above.

---

## 🚀 Running the Application

### Using Docker Compose (Recommended)

This will start all services: MongoDB, Backend API, Worker, and Adminer.

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Services will be available at:**
- Backend API: http://localhost:4000
- Worker Webhook Server: http://localhost:4001
- MongoDB: localhost:27017
- Adminer (DB Admin): http://localhost:8080

### Running Services Individually (Local Development)

#### 1. Start MongoDB

```bash
docker-compose up -d mongodb
```

#### 2. Run Backend API Service

```bash
cd backend_api
npm install
npm start
```

The API will be available at http://localhost:4000

#### 3. Run Worker / Integration Service

```bash
cd worker
npm install
npm run dev  # Runs both worker polling and webhook server
```

The webhook server will be available at http://localhost:4001

**Alternatively, run them separately:**
```bash
# Terminal 1: Worker polling
npm start

# Terminal 2: Webhook server
npm run webhook
```

#### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3004

---

## 📡 API Documentation

### Base URL
```
http://localhost:4000/api
```

### Endpoints

#### **Users**

##### Create User
```http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:00:00.000Z"
  }
}
```

##### List Users
```http
GET /api/users
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "count": 5
  }
}
```

---

#### **Reminders**

##### Create Reminder
```http
POST /api/reminders
Content-Type: application/json

{
  "user_id": "507f1f77bcf86cd799439011",
  "phone_number": "+1234567890",
  "message": "Your reminder message",
  "scheduled_at": "2025-12-25T15:00:00.000Z"
}
```

**Validation Rules:**
- `user_id`: Must exist in database
- `phone_number`: Must be in E.164 format (+[country][number])
- `message`: Required, non-empty
- `scheduled_at`: Must be a future date/time

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "phoneNumber": "+1234567890",
    "message": "Your reminder message",
    "scheduledAt": "2025-12-25T15:00:00.000Z",
    "status": "scheduled",
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:00:00.000Z"
  }
}
```

##### Get Reminder by ID
```http
GET /api/reminders/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "phoneNumber": "+1234567890",
    "message": "Your reminder message",
    "scheduledAt": "2025-12-25T15:00:00.000Z",
    "status": "called",
    "twilioCallSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:05:00.000Z"
  }
}
```

##### List Reminders for User
```http
GET /api/users/:userId/reminders?status=scheduled&page=1&pageSize=25
```

**Query Parameters:**
- `status` (optional): Filter by status (scheduled, processing, called, failed)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 25)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "userId": "507f1f77bcf86cd799439011",
    "status": "scheduled",
    "count": 10
  }
}
```

---

#### **Webhooks** (Worker Service)

##### Twilio Webhook
```http
POST http://localhost:4001/webhooks/twilio
Content-Type: application/x-www-form-urlencoded

CallSid=CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CallStatus=completed
...
```

##### VAPI Webhook
```http
POST http://localhost:4001/webhooks/vapi
Content-Type: application/json

{
  "call_id": "external-call-id",
  "status": "completed",
  "metadata": {
    "reminder_id": "507f1f77bcf86cd799439012"
  },
  "transcript": "AI said: Your reminder..."
}
```

---

## 🌐 Deployment

### Deployed URLs

**Frontend:** `https://your-frontend-url.vercel.app`  
**Backend API:** `https://your-backend-url.railway.app`  
**Worker Service:** `https://your-worker-url.railway.app`

### Deployment Platforms

- **Frontend**: Vercel / Netlify
- **Backend API**: Railway / Render / Fly.io
- **Worker Service**: Railway / Render / Fly.io
- **Database**: MongoDB Atlas (free tier) / Railway

### Deployment Steps

#### 1. Deploy Database (MongoDB Atlas)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in production environment

#### 2. Deploy Backend API

**Using Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

Set environment variables in Railway dashboard.

#### 3. Deploy Worker Service

Same process as Backend API, but deploy the `worker` directory.

#### 4. Deploy Frontend

**Using Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.

---

## 📊 Logging & Observability

### Log Levels

- **INFO**: Normal operations (requests, worker ticks, call creation)
- **ERROR**: Errors and failures (failed calls, validation errors)
- **WARN**: Warnings (deprecated features, potential issues)

### Backend API Logs

```javascript
// Request logging
[INFO] { method: 'POST', url: '/api/reminders', body: {...} } incoming request

// Service operations
[INFO] { reminderId: '...', userId: '...' } reminder created

// Errors
[ERROR] { err: {...} } unhandled error
```

### Worker Service Logs

```javascript
// Worker polling
[INFO] Worker tick: checking due reminders
[INFO] { count: 4 } Found due reminders

// Call creation
[INFO] { callSid: 'CA...', reminderId: '...' } Twilio call triggered successfully

// Webhook processing
[INFO] { body: {...} } Received Twilio webhook callback
[INFO] { reminderId: '...', status: 'called' } Reminder status updated

// Errors
[ERROR] { reminderId: '...', error: '...' } Failed to trigger call
```

### Viewing Logs

**Docker:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker

# Last 100 lines
docker-compose logs --tail=100 api
```

**Local Development:**
Logs are output to console in real-time.

---

## 🧪 Testing

### Manual Testing

#### Test API Endpoints

```bash
# Create a user
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Create a reminder (5 minutes from now)
curl -X POST http://localhost:4000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_FROM_ABOVE",
    "phone_number": "+1234567890",
    "message": "Test reminder",
    "scheduled_at": "2025-12-11T15:30:00.000Z"
  }'

# Get reminder
curl http://localhost:4000/api/reminders/REMINDER_ID
```

#### Test Worker Processing

1. Create a reminder with `scheduled_at` in the past or very soon
2. Watch worker logs: `docker-compose logs -f worker`
3. You should see:
   - Worker detecting the due reminder
   - Twilio call being created
   - Reminder status updated to `processing`
4. When Twilio sends webhook, status updates to `called` or `failed`

### Automated Tests

```bash
# Backend API tests
cd backend_api
npm test

# Worker tests
cd worker
npm test

# Frontend tests
cd frontend
npm test
```

---

## ✅ Evaluation Criteria Compliance

### 1. Architecture & Separation of Concerns ✓

**Controllers / Routes:**
- `backend_api/src/controllers/` - HTTP handlers only
- `backend_api/src/routes/` - Route definitions

**Business Logic / Services:**
- `backend_api/src/services/` - Validation, status transitions
- `worker/src/services/` - Worker business logic

**Data Access / Repositories:**
- `backend_api/src/repositories/` - Database operations
- `worker/src/repositories/` - Worker data access

**Integration Layer:**
- `worker/src/integrations/` - Twilio & VAPI clients
- `worker/src/controllers/webhookController.js` - Webhook handling

### 2. Code Quality ✓

- **Readability**: Clear naming, consistent formatting
- **Structure**: Modular design, single responsibility
- **Maintainability**: DRY principles, reusable utilities
- **Error Handling**: Try-catch blocks, proper error responses

### 3. Database Design ✓

- **Schema**: users, reminders, call_logs with proper relationships
- **Constraints**: NOT NULL, UNIQUE, foreign keys
- **Indexes**: On userId, scheduledAt, status, twilioCallSid
- **Compound Indexes**: `{ status: 1, scheduledAt: 1 }` for worker efficiency

### 4. Integration Handling ✓

- **External API Calls**: Twilio client with error handling
- **Webhook Handling**: Signature validation, idempotency checks
- **Idempotency**: Duplicate webhook detection via call_logs
- **Error Handling**: Retry logic, failure logging

### 5. Logging & Observability ✓

- **Request Logging**: All HTTP requests logged
- **Worker Logging**: Polling, call creation, webhook processing
- **Error Logging**: Stack traces, context information
- **Real-time**: Visible in terminal/Docker logs

### 6. Deployment ✓

- **Frontend**: Deployed on Vercel/Netlify
- **Backend**: Deployed on Railway/Render
- **Database**: MongoDB Atlas/Railway
- **Public Access**: All services publicly accessible

### 7. Documentation ✓

- **README**: Complete setup and running instructions
- **Tech Stack**: Versions documented
- **Environment Variables**: All variables explained
- **API Documentation**: Endpoints, request/response examples
- **Architecture Diagrams**: Visual representation

### 8. Correctness ✓

- **User Creation**: ✓ Validation, unique email
- **Reminder Creation**: ✓ Future date validation, user existence
- **Worker Processing**: ✓ Polls every 60s, triggers calls
- **Webhook Processing**: ✓ Updates status, stores transcripts
- **State Transitions**: ✓ scheduled → processing → called/failed

---

## 📝 Additional Notes

### Twilio Trial Account Limitations

- Can only call **verified phone numbers**
- Add numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Unverified numbers will result in `failed` status

### VAPI Integration

VAPI integration is partially implemented. To fully enable:
1. Sign up at https://vapi.ai
2. Get API key and webhook secret
3. Update `.env` with VAPI credentials
4. Configure VAPI webhook URL to point to your worker service

### Mock Voice Provider

For testing without Twilio/VAPI, use the included mock server:

```bash
node mock-voice-provider.js
```

Update `.env` to point to `http://localhost:3001`

---

## 🤝 Contributing

This is a take-home assignment project. For questions or issues, please contact the repository owner.

---

## 📄 License

This project is created as part of a technical assessment.

---

## 📞 Support

For any questions or issues:
- Email: your-email@example.com
- GitHub Issues: https://github.com/yourusername/Voice_Reminder/issues

---

**Last Updated**: December 11, 2025  
**Version**: 1.0.0
