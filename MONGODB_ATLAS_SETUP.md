# MongoDB Atlas Setup - Step by Step Guide

Follow these EXACT steps to set up your MongoDB Atlas database.

---

## Step 1: Create MongoDB Atlas Account

1. Open your browser and go to: **https://www.mongodb.com/cloud/atlas**

2. Click **"Try Free"** or **"Sign Up"** button

3. You can sign up with:
   - **Google account** (recommended - fastest)
   - **Email and password**

4. If using email:
   - Enter your email
   - Create a password
   - Click **"Create your Atlas account"**

5. Verify your email if prompted

---

## Step 2: Create Your First Cluster

1. After logging in, you'll see **"Welcome to Atlas"** page

2. Click **"Build a Database"** (green button)

3. You'll see 3 options - Choose **"M0 FREE"**:
   ```
   M0 Sandbox (FREE)
   - Shared RAM
   - 512 MB Storage
   - Shared vCPU
   ```

4. Click **"Create"** button under M0

5. Configure your cluster:
   - **Cloud Provider**: Choose **AWS** (recommended)
   - **Region**: Choose closest to you:
     - If in Pakistan/Asia: **Mumbai (ap-south-1)** or **Singapore (ap-southeast-1)**
     - If in US: **N. Virginia (us-east-1)**
     - If in Europe: **Ireland (eu-west-1)**
   
6. **Cluster Name**: Leave as `Cluster0` or change to `voice-reminder-db`

7. Click **"Create Cluster"** button at bottom

8. Wait 1-3 minutes for cluster to be created (you'll see a progress bar)

---

## Step 3: Create Database User

1. While cluster is creating, you'll see a **"Security Quickstart"** popup

2. If you see the popup:
   - **Authentication Method**: Keep **"Username and Password"** selected
   - **Username**: Type `voicereminder`
   - **Password**: Click **"Autogenerate Secure Password"** button
   - **IMPORTANT**: Click the **"Copy"** button to copy the password
   - **Paste it somewhere safe** (Notepad, text file, etc.)
   - Click **"Create User"** button

3. If you don't see the popup:
   - Click **"Database Access"** in left sidebar (under SECURITY)
   - Click **"Add New Database User"** button
   - **Authentication Method**: Select **"Password"**
   - **Username**: Type `voicereminder`
   - **Password**: Click **"Autogenerate Secure Password"**
   - **Copy the password and save it!**
   - **Database User Privileges**: Keep **"Read and write to any database"**
   - Click **"Add User"** button

---

## Step 4: Whitelist IP Addresses

1. You should see **"Where would you like to connect from?"** section

2. If you see it:
   - Click **"My Local Environment"**
   - Click **"Add My Current IP Address"** button
   - Then click **"Add Entry"**
   - **ALSO** click **"Add a Different IP Address"**
   - Enter: `0.0.0.0/0`
   - Description: `Allow all (for deployment)`
   - Click **"Add Entry"**
   - Click **"Finish and Close"** button

3. If you don't see it:
   - Click **"Network Access"** in left sidebar (under SECURITY)
   - Click **"Add IP Address"** button
   - Click **"Allow Access from Anywhere"** button
   - You'll see IP Address: `0.0.0.0/0`
   - Description: `Allow access from anywhere`
   - Click **"Confirm"** button

---

## Step 5: Get Your Connection String

1. Click **"Database"** in left sidebar (under DEPLOYMENT)

2. You should see your cluster (Cluster0 or voice-reminder-db)

3. Click the **"Connect"** button (it's a button on your cluster card)

4. You'll see **"Connect to Cluster0"** popup with 3 options

5. Click **"Drivers"** (the middle option)

6. You'll see:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
   - Keep these as is

7. Scroll down to **"Add your connection string into your application code"**

8. You'll see a connection string like:
   ```
   mongodb+srv://voicereminder:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

9. Click the **"Copy"** button to copy this string

10. **IMPORTANT**: You need to modify this string:
    - Replace `<password>` with the password you saved earlier
    - Add `/voice_reminder` before the `?`
    
    **Example:**
    ```
    Before:
    mongodb+srv://voicereminder:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
    
    After (replace <password> with your actual password):
    mongodb+srv://voicereminder:YourActualPassword123@cluster0.abc123.mongodb.net/voice_reminder?retryWrites=true&w=majority
    ```

---

## Step 6: Update Your .env File

1. Open your `.env` file in VS Code

2. Find these lines:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/voice_reminder
   DATABASE_URL=mongodb://admin:password@localhost:27017/voice_reminder?authSource=admin
   ```

3. Replace them with your MongoDB Atlas connection string:
   ```bash
   MONGODB_URI=mongodb+srv://voicereminder:YourActualPassword123@cluster0.abc123.mongodb.net/voice_reminder?retryWrites=true&w=majority
   DATABASE_URL=mongodb+srv://voicereminder:YourActualPassword123@cluster0.abc123.mongodb.net/voice_reminder?retryWrites=true&w=majority
   ```

4. **Make sure to use YOUR actual password and YOUR actual cluster URL!**

5. Save the file (Ctrl+S or Cmd+S)

---

## Step 7: Test the Connection

1. Stop your Docker containers:
   ```bash
   docker-compose down
   ```

2. Start them again:
   ```bash
   docker-compose up --build
   ```

3. Watch the logs - you should see:
   ```
   [INFO] MongoDB Connected: cluster0.xxxxx.mongodb.net
   ```

4. If you see this, **SUCCESS!** ✅

---

## ⚠️ Common Issues

### Issue 1: "Authentication failed"
- **Solution**: Double-check your password in the connection string
- Make sure there are no extra spaces
- Password is case-sensitive

### Issue 2: "Connection timeout"
- **Solution**: Check Network Access settings
- Make sure `0.0.0.0/0` is added
- Wait 2-3 minutes after adding IP whitelist

### Issue 3: "Database not found"
- **Solution**: Make sure you added `/voice_reminder` before the `?` in connection string
- Correct: `...mongodb.net/voice_reminder?retryWrites...`
- Wrong: `...mongodb.net/?retryWrites...`

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created
- [ ] Free M0 cluster created
- [ ] Database user `voicereminder` created
- [ ] Password saved securely
- [ ] IP address `0.0.0.0/0` whitelisted
- [ ] Connection string copied
- [ ] Password replaced in connection string
- [ ] `/voice_reminder` added to connection string
- [ ] `.env` file updated with new connection strings
- [ ] Docker containers restarted
- [ ] Connection successful (check logs)

---

## 📝 Save This Information

**Username**: `voicereminder`
**Password**: `[Your generated password]`
**Connection String**: `mongodb+srv://voicereminder:[password]@cluster0.[xxxxx].mongodb.net/voice_reminder?retryWrites=true&w=majority`
**Cluster Name**: `Cluster0` (or whatever you named it)

---

**Next Step**: After MongoDB Atlas is working, you can proceed to deploy Backend API to Railway!
