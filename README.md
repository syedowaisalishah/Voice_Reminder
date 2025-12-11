# Voice Reminder Service

A complete voice reminder system that allows users to schedule voice reminders, which are executed via external Voice Provider APIs (Twilio). The system triggers calls at scheduled times and processes webhook callbacks to track call status.

> **Assignment Submission**: This project is submitted as a take-home assignment for backend development evaluation.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Setup Instructions](#️-setup-instructions)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Logging & Observability](#-logging--observability)
- [Testing](#-testing)
- [Evaluation Criteria Compliance](#-evaluation-criteria-compliance)

---

## 🛠 Tech Stack

### Backend API Service
- **Runtime**: Node.js v18.20.8
- **Framework**: Express.js v4.18.2
- **Database**: MongoDB Atlas (cloud-hosted)
- **ODM**: Mongoose v8.0.0
- **Logging**: Pino v8.12.0
- **Validation**: Custom validators with E.164 phone number format

### Worker / Integration Service
- **Runtime**: Node.js v18.20.8
- **Framework**: Express.js v4.18.2 (for webhook server)
- **Integrations**: Twilio SDK v4.0.0
- **Process Management**: Concurrently (runs worker + webhook server)
- **Logging**: Pino v8.12.0
- **Polling Interval**: 60 seconds

### Frontend
- **Framework**: Next.js v14.0.0
- **UI Library**: React v18.2.0
- **Styling**: Tailwind CSS v3.3.0
- **HTTP Client**: Axios v1.6.0
- **State Management**: React Hooks

### Deployment & Hosting
- **Frontend**: Vercel
- **Backend API**: Railway
- **Worker Service**: Railway
- **Database**: MongoDB Atlas (Free Tier)
- **Environment Management**: dotenv

---

## 🏗 Architecture Overview

### Separation of Concerns

The application follows a **clean architecture** with clear separation between layers:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                  (Next.js on Vercel)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API SERVICE                        │
│                  (Express on Railway)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │→ │   Services   │→ │ Repositories │      │
│  │  (Routes)    │  │(Business Logic)│ │(Data Access) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  MONGODB ATLAS DATABASE                      │
│  Collections: users, reminders, call_logs                   │
└─────────────────────────────────────────────────────────────┘
                     ▲
                     │
┌────────────────────┴────────────────────────────────────────┐
│              WORKER / INTEGRATION SERVICE                    │
│                  (Node.js on Railway)                        │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Worker Polling  │      │  Webhook Server  │            │
│  │  (Every 60s)     │      │  (Port 4001)     │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           ▼                         ▼                       │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Twilio Client    │      │ Webhook Handler  │            │
│  └──────────────────┘      └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    TWILIO VOICE API                          │
│              (External Voice Provider)                       │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. **Controllers / Routes** (HTTP Layer)
- Handle HTTP requests/responses only
- Input validation and sanitization
- No business logic
- **Location**: `backend_api/src/routes/` and `backend_api/src/controllers/`

#### 2. **Services** (Business Logic Layer)
- Implement domain rules and validation
- Coordinate between repositories
- Status transitions and scheduling logic
- **Location**: `backend_api/src/services/`

#### 3. **Repositories** (Data Access Layer)
- Encapsulate all database operations
- No business logic
- Return domain models
- **Location**: `backend_api/src/repositories/`

#### 4. **Integration Layer**
- External API clients (Twilio)
- Webhook handling and validation
- **Location**: `worker/src/integrations/` and `worker/src/controllers/`

---

## 📁 Project Structure

```
Voice_Reminder/
├── backend_api/                 # Reminder API Service
│   ├── src/
│   │   ├── controllers/         # HTTP request handlers
│   │   │   ├── reminder.ctrl.js
│   │   │   └── user.ctrl.js
│   │   ├── services/            # Business logic
│   │   │   ├── reminder.service.js
│   │   │   └── user.service.js
│   │   ├── repositories/        # Data access layer
│   │   │   ├── reminder.repo.js
│   │   │   └── user.repo.js
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
│   ├── railway.json             # Railway deployment config
│   ├── start.sh                 # Railway start script
│   └── package.json
│
├── worker/                      # Worker / Integration Service
│   ├── src/
│   │   ├── integrations/        # External API clients
│   │   │   └── twilioClient.js
│   │   ├── controllers/         # Webhook handlers
│   │   │   └── webhook.controller.js
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── reminder.model.js
│   │   │   ├── user.model.js
│   │   │   └── calllog.model.js
│   │   ├── repositories/        # Data access
│   │   │   ├── reminder.repository.js
│   │   │   └── calllog.repository.js
│   │   ├── services/            # Worker business logic
│   │   │   └── reminder.service.js
│   │   ├── utils/               # Utilities
│   │   │   └── logger.js
│   │   ├── config/              # Configuration
│   │   │   └── db.js
│   │   ├── worker.js            # Worker polling script
│   │   └── webhook-server.js    # Webhook HTTP server
│   ├── railway.json             # Railway deployment config
│   ├── start.sh                 # Railway start script
│   └── package.json
│
├── frontend/                    # Next.js Frontend
│   ├── components/              # React components
│   │   ├── ReminderForm.js
│   │   ├── ReminderList.js
│   │   └── UserForm.js
│   ├── lib/                     # Utilities
│   │   └── api.js               # API client
│   ├── pages/                   # Next.js pages
│   │   ├── index.js             # Home page
│   │   ├── users/               # Users pages
│   │   └── reminders/           # Reminders pages
│   ├── styles/                  # CSS styles
│   └── package.json
│
├── .env.example                 # Environment template
├── .gitignore
├── mock-voice-provider.js       # Mock server for testing
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
  status: String (enum: ['scheduled', 'processing', 'called', 'failed'], default: 'scheduled'),
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
  provider: String (enum: ['twilio'], required),
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
│processing│  ← Call requested from Twilio
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

- **Node.js** v18+ installed
- **Git** installed
- **MongoDB Atlas account** (free tier) - Database already deployed
- **Twilio account** with phone number

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Voice_Reminder.git
cd Voice_Reminder
```

### 2. Configure Environment Variables

**Important:** The actual `.env` file with working credentials is submitted separately as per assignment requirements.

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

```bash
# MongoDB Atlas Connection (Get from your colleague)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority

# API Configuration
PORT=4000
NODE_ENV=development
PUBLIC_BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# Worker Configuration
WORKER_POLL_INTERVAL_SECONDS=60
WEBHOOK_PORT=4001
WEBHOOK_BASE_URL=http://localhost:4001

# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXXX
TWILIO_CALL_STATUS_CALLBACK_URL=http://your-public-url:4001/webhooks/call-status
```

**Environment Variable Descriptions:**

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `DATABASE_URL` | Alternative MongoDB connection string | Yes |
| `PORT` | Backend API port (default: 4000) | Yes |
| `PUBLIC_BASE_URL` | Public URL of backend API | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `WORKER_POLL_INTERVAL_SECONDS` | Worker polling frequency in seconds | Yes |
| `WEBHOOK_PORT` | Webhook server port | Yes |
| `WEBHOOK_BASE_URL` | Public webhook URL | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio authentication token | Yes |
| `TWILIO_FROM_NUMBER` | Twilio phone number (E.164 format) | Yes |
| `TWILIO_CALL_STATUS_CALLBACK_URL` | Webhook URL for Twilio callbacks | Yes |

### 3. Database Setup

The MongoDB database is already deployed on MongoDB Atlas by your colleague. No manual migration scripts are needed as Mongoose handles schema creation automatically.

**To connect:**
1. Get the MongoDB Atlas connection string from your colleague
2. Update `MONGODB_URI` and `DATABASE_URL` in your `.env` file
3. Ensure your IP address is whitelisted in MongoDB Atlas (or use `0.0.0.0/0` for all IPs)

---

## 🚀 Running the Application

### Running Services Locally

#### 1. Install Dependencies

```bash
# Backend API
cd backend_api
npm install

# Worker Service
cd ../worker
npm install

# Frontend
cd ../frontend
npm install
```

#### 2. Run Backend API Service

```bash
cd backend_api
npm start
```

The API will be available at **http://localhost:4000**

**Logs will show:**
```
[INFO] Backend API MongoDB Connected: mongodb+srv://...
[INFO] Server running on port 4000
```

#### 3. Run Worker / Integration Service

```bash
cd worker
npm run dev  # Runs both worker polling and webhook server
```

The webhook server will be available at **http://localhost:4001**

**Logs will show:**
```
[INFO] Worker MongoDB Connected: mongodb+srv://...
[INFO] Voice Reminder Worker starting...
[INFO] Webhook server started on port 4001
[INFO] Worker is now running and polling for due reminders
```

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
npm run dev
```

The frontend will be available at **http://localhost:3000**

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

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Email is required"
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
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "createdAt": "2025-12-11T10:00:00.000Z",
      "updatedAt": "2025-12-11T10:00:00.000Z"
    }
  ],
  "meta": {
    "count": 1
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

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "scheduled_at must be in the future"
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
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "phoneNumber": "+1234567890",
      "message": "Your reminder message",
      "scheduledAt": "2025-12-25T15:00:00.000Z",
      "status": "scheduled",
      "createdAt": "2025-12-11T10:00:00.000Z",
      "updatedAt": "2025-12-11T10:00:00.000Z"
    }
  ],
  "meta": {
    "userId": "507f1f77bcf86cd799439011",
    "status": "scheduled",
    "count": 1
  }
}
```

---

#### **Webhooks** (Worker Service)

##### Twilio Webhook
```http
POST http://localhost:4001/webhooks/call-status
Content-Type: application/x-www-form-urlencoded

CallSid=CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CallStatus=completed
```

**Webhook Processing:**
- Validates Twilio signature (in production)
- Finds reminder by `CallSid`
- Updates reminder status to `called` or `failed`
- Creates call log entry
- Implements idempotency (duplicate webhooks ignored)

---

## 🌐 Deployment

### Deployed URLs

**Frontend:** `https://your-frontend.vercel.app`  
**Backend API:** `https://your-backend.railway.app`  
**Worker Service:** `https://your-worker.railway.app`  
**Database:** MongoDB Atlas (deployed by colleague)

### Deployment Platforms

- **Frontend**: Vercel
- **Backend API**: Railway
- **Worker Service**: Railway
- **Database**: MongoDB Atlas (Free Tier)

### Deployment Steps

#### 1. Database (MongoDB Atlas)

✅ **Already deployed by colleague**

Get the connection string and update environment variables in Railway and Vercel.

#### 2. Deploy Backend API to Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `Voice_Reminder` repository
4. Configure service:
   - **Root Directory**: `backend_api`
   - **Build Command**: `npm install` (auto-detected)
   - **Start Command**: `npm start` (auto-detected)
5. Add environment variables (see `.env.example`)
6. Click **"Deploy"**
7. Go to **Settings** → **Networking** → **Generate Domain**
8. Save the URL for frontend configuration

#### 3. Deploy Worker Service to Railway

1. In the same Railway project, click **"New Service"**
2. Select **"GitHub Repo"** → Choose your repository
3. Configure service:
   - **Root Directory**: `worker`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run dev`
4. Add environment variables (see `.env.example`)
5. Generate domain for webhook URL
6. Update `WEBHOOK_BASE_URL` and `TWILIO_CALL_STATUS_CALLBACK_URL` with the generated URL

#### 4. Configure Twilio Webhook

1. Go to https://console.twilio.com
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your Twilio phone number
4. Under **Voice Configuration** → **A CALL COMES IN**:
   - Webhook URL: `https://your-worker.railway.app/webhooks/call-status`
   - HTTP Method: **POST**
5. Click **Save**

#### 5. Deploy Frontend to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **"Add New Project"** → Import your repository
3. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://your-backend.railway.app/api`
5. Click **"Deploy"**
6. Copy the Vercel URL

#### 6. Update Backend CORS

1. Go back to Railway → Backend Service → Variables
2. Update `FRONTEND_URL` with your Vercel URL
3. Railway will automatically redeploy

---

## 📊 Logging & Observability

### Log Levels

- **INFO**: Normal operations (requests, worker ticks, call creation)
- **ERROR**: Errors and failures (failed calls, validation errors)
- **WARN**: Warnings (potential issues)

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

**Local Development:**
Logs are output to console in real-time.

**Railway (Production):**
```
Project → Service → Deployments → Latest → View Logs
```

**Vercel (Frontend):**
```
Project → Deployments → Latest → Functions
```

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
2. Watch worker logs in terminal
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

### Mock Voice Provider

For testing without Twilio, use the included mock server:

```bash
node mock-voice-provider.js
```

Update `.env` to point to `http://localhost:3001`

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
- `worker/src/integrations/` - Twilio client
- `worker/src/controllers/webhook.controller.js` - Webhook handling

### 2. Code Quality ✓

- **Readability**: Clear naming, consistent formatting
- **Structure**: Modular design, single responsibility
- **Maintainability**: DRY principles, reusable utilities
- **Error Handling**: Try-catch blocks, proper error responses

### 3. Database Design ✓

- **Schema**: users, reminders, call_logs with proper relationships
- **Constraints**: NOT NULL, UNIQUE, foreign keys (via Mongoose)
- **Indexes**: On userId, scheduledAt, status, twilioCallSid
- **Compound Indexes**: `{ status: 1, scheduledAt: 1 }` for worker efficiency

### 4. Integration Handling ✓

- **External API Calls**: Twilio client with error handling and retry logic
- **Webhook Handling**: Signature validation, idempotency checks
- **Idempotency**: Duplicate webhook detection via call_logs unique index
- **Error Handling**: Graceful failure logging and status updates

### 5. Logging & Observability ✓

- **Request Logging**: All HTTP requests logged with method, URL, body
- **Worker Logging**: Polling, call creation, webhook processing
- **Error Logging**: Stack traces, context information
- **Real-time**: Visible in terminal during local development, Railway/Vercel logs in production

### 6. Deployment ✓

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Railway
- **Worker**: Deployed on Railway
- **Database**: MongoDB Atlas
- **Public Access**: All services publicly accessible

### 7. Documentation ✓

- **README**: Complete setup and running instructions
- **Tech Stack**: Versions documented
- **Environment Variables**: All variables explained
- **API Documentation**: Endpoints, request/response examples
- **Architecture Diagrams**: Visual representation

### 8. Correctness ✓

- **User Creation**: ✓ Validation, unique email
- **Reminder Creation**: ✓ Future date validation, user existence, E.164 phone format
- **Worker Processing**: ✓ Polls every 60s, triggers calls
- **Webhook Processing**: ✓ Updates status, stores call logs, idempotent
- **State Transitions**: ✓ scheduled → processing → called/failed

---

## 📝 Additional Notes

### Twilio Trial Account Limitations

- Can only call **verified phone numbers**
- Add numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Unverified numbers will result in `failed` status

### Geographic Permissions

Ensure Pakistan (or your target country) is enabled in Twilio:
- https://console.twilio.com/us1/develop/voice/settings/geo-permissions

### Call Not Ringing?

If calls show "No Answer" status:
- Check Twilio call logs for detailed error messages
- Verify phone number format is E.164
- Ensure geographic permissions are enabled
- Check if carrier is blocking international VoIP calls
- See troubleshooting guide in project documentation

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

**Submission Date**: December 11, 2025  
**Version**: 1.0.0  
**Assignment**: Voice Reminder Service - Backend Development Take-Home
