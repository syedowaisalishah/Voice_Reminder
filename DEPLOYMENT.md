# Deployment Guide - Voice Reminder Service

This guide will help you deploy the Voice Reminder application to production.

## 📋 Prerequisites

- GitHub account
- Vercel account (for frontend) - https://vercel.com
- Railway account (for backend & worker) - https://railway.app
- MongoDB Atlas account (for database) - https://www.mongodb.com/cloud/atlas

---

## 🗄️ Step 1: Deploy Database (MongoDB Atlas)

### 1.1 Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click **"Build a Database"**
4. Select **"M0 FREE"** tier
5. Choose your cloud provider and region (closest to your users)
6. Click **"Create Cluster"**

### 1.2 Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `voicereminder`
5. Password: Generate a strong password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Whitelist IP Addresses

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - IP Address: `0.0.0.0/0`
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **Database** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string:
   ```
   mongodb+srv://voicereminder:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `voice_reminder`
   ```
   mongodb+srv://voicereminder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority
   ```

---

## 🚂 Step 2: Deploy Backend API (Railway)

### 2.1 Prepare Backend for Deployment

1. Make sure your `backend_api/package.json` has a start script:
   ```json
   "scripts": {
     "start": "node src/server.js"
   }
   ```

2. Create `backend_api/.env.example` if not exists (for reference)

### 2.2 Deploy to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Authorize Railway to access your repository
6. Select your `Voice_Reminder` repository
7. Railway will detect it's a monorepo

### 2.3 Configure Backend Service

1. Click **"Add Service"** → **"GitHub Repo"**
2. In **Settings**:
   - **Root Directory**: `backend_api`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.4 Add Environment Variables

Go to **Variables** tab and add:

```bash
# Database
MONGODB_URI=mongodb+srv://voicereminder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://voicereminder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority

# API Configuration
PORT=4000
NODE_ENV=production
PUBLIC_BASE_URL=https://your-backend-url.railway.app
FRONTEND_URL=https://your-frontend-url.vercel.app

# Twilio (add your credentials)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

### 2.5 Get Backend URL

1. After deployment, go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://voice-reminder-backend.railway.app`)
4. Save this URL - you'll need it for frontend

---

## 🚂 Step 3: Deploy Worker Service (Railway)

### 3.1 Create Worker Service

1. In the same Railway project, click **"New Service"**
2. Select **"GitHub Repo"** → Choose your repository
3. In **Settings**:
   - **Root Directory**: `worker`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run dev`

### 3.2 Add Environment Variables

Go to **Variables** tab and add:

```bash
# Database
MONGODB_URI=mongodb+srv://voicereminder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority
DATABASE_URL=mongodb+srv://voicereminder:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/voice_reminder?retryWrites=true&w=majority

# Worker Configuration
WORKER_POLL_INTERVAL_SECONDS=60
WEBHOOK_PORT=4001
NODE_ENV=production

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
TWILIO_CALL_STATUS_CALLBACK_URL=https://your-worker-url.railway.app/webhooks/call-status

# VAPI Configuration (optional)
VAPI_BASE_URL=https://api.vapi.ai
VAPI_API_KEY=your_vapi_api_key
VAPI_WEBHOOK_SECRET=your_webhook_secret
```

### 3.3 Get Worker URL

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://voice-reminder-worker.railway.app`)
4. **IMPORTANT**: Update `TWILIO_CALL_STATUS_CALLBACK_URL` with this URL

### 3.4 Configure Twilio Webhook

1. Go to Twilio Console: https://console.twilio.com
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your Twilio phone number
4. Scroll to **Voice & Fax**
5. Under **A CALL COMES IN**, set:
   - Webhook URL: `https://your-worker-url.railway.app/webhooks/call-status`
   - HTTP Method: `POST`
6. Click **Save**

---

## ▲ Step 4: Deploy Frontend (Vercel)

### 4.1 Prepare Frontend

1. Make sure `frontend/package.json` has build script:
   ```json
   "scripts": {
     "build": "next build",
     "start": "next start"
   }
   ```

2. Create `frontend/.env.production`:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app/api
   ```

### 4.2 Deploy to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import your `Voice_Reminder` repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 4.3 Add Environment Variables

In Vercel project settings → **Environment Variables**:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app/api
```

### 4.4 Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your frontend URL (e.g., `https://voice-reminder.vercel.app`)

### 4.5 Update Backend CORS

Go back to Railway → Backend Service → Variables:
```bash
FRONTEND_URL=https://voice-reminder.vercel.app
```

Redeploy the backend service.

---

## ✅ Step 5: Verify Deployment

### 5.1 Test Backend API

```bash
curl https://your-backend-url.railway.app/
# Should return: {"status":"ok"}

curl https://your-backend-url.railway.app/api/users
# Should return: {"success":true,"data":[],"meta":{"count":0}}
```

### 5.2 Test Worker Webhook

```bash
curl https://your-worker-url.railway.app/health
# Should return: {"status":"ok","service":"voice-reminder-worker-webhook",...}
```

### 5.3 Test Frontend

1. Open `https://your-frontend-url.vercel.app` in browser
2. Create a user
3. Create a reminder
4. Check if it appears in the list

### 5.4 Test End-to-End Flow

1. Create a reminder scheduled for 2 minutes from now
2. Wait for worker to trigger the call
3. Check Twilio logs to confirm call was made
4. Verify reminder status updates to "called" or "failed"

---

## 🔧 Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify MongoDB connection string is correct
- Ensure all environment variables are set

### Worker not triggering calls
- Check Railway logs for worker service
- Verify Twilio credentials are correct
- Check MongoDB connection
- Verify `WORKER_POLL_INTERVAL_SECONDS` is set

### Webhooks not working
- Verify worker URL is publicly accessible
- Check Twilio webhook configuration
- Test webhook endpoint: `curl https://your-worker-url.railway.app/health`
- Check worker logs for incoming webhook requests

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check CORS settings in backend (`FRONTEND_URL`)
- Test backend API directly with curl
- Check browser console for CORS errors

### Database connection issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user credentials
- Test connection string locally first

---

## 📊 Monitoring

### Railway Logs

View logs for each service:
1. Go to Railway project
2. Click on service (Backend/Worker)
3. Click **"Deployments"** → Latest deployment
4. View logs in real-time

### Vercel Logs

1. Go to Vercel project
2. Click **"Deployments"**
3. Click on latest deployment
4. View **"Functions"** logs

### MongoDB Atlas Monitoring

1. Go to MongoDB Atlas
2. Click on your cluster
3. View **"Metrics"** tab for database performance

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** for MongoDB
3. **Rotate API keys** regularly (Twilio, VAPI)
4. **Enable HTTPS only** - Railway and Vercel provide this automatically
5. **Limit CORS origins** - Set specific frontend URL, not `*`
6. **Monitor logs** for suspicious activity

---

## 🚀 Quick Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Backend deployed to Railway
- [ ] Backend environment variables set
- [ ] Backend URL obtained
- [ ] Worker deployed to Railway
- [ ] Worker environment variables set
- [ ] Worker URL obtained
- [ ] Twilio webhook configured with worker URL
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] Frontend URL obtained
- [ ] Backend CORS updated with frontend URL
- [ ] All services tested and working

---

## 📝 Deployed URLs Template

Save these URLs for reference:

```
Frontend: https://voice-reminder.vercel.app
Backend API: https://voice-reminder-backend.railway.app
Worker: https://voice-reminder-worker.railway.app
Database: mongodb+srv://cluster0.xxxxx.mongodb.net/voice_reminder

Twilio Webhook: https://voice-reminder-worker.railway.app/webhooks/call-status
```

---

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Twilio Docs: https://www.twilio.com/docs

---

**Last Updated**: December 11, 2025
