# Frontend Implementation Guide

## Overview
The frontend is built using **Next.js**, a React framework. It needs to implement a minimal web interface to interact with the backend API for managing users and reminders.

---

## Current Structure

```
frontend/
├── Dockerfile
├── next.config.js
├── package.json (empty - needs setup)
├── components/
│   ├── CreateReminderForm.js
│   ├── CreateUserForm.js
│   └── ReminderList.js
└── pages/
    ├── index.js (Home/Users Page)
    ├── users.js
    ├── reminders.js
    ├── reminder/
    │   └── [id].js (Reminder Detail Page)
```

---

## 1. Setup and Dependencies

### Install Required Dependencies

```bash
cd Voice_Reminder/frontend
npm init -y
npm install next react react-dom axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Update `package.json` Scripts:

```json
{
  "name": "voice-reminder-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 2. Environment Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

For production deployment, update to the actual backend API URL.

---

## 3. API Integration Layer

Create `lib/api.js` for centralized API calls:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users API
export const getUsers = () => api.get('/users');
export const createUser = (email) => api.post('/users', { email });

// Reminders API
export const getUserReminders = (userId) => api.get(`/users/${userId}/reminders`);
export const getReminder = (id) => api.get(`/reminders/${id}`);
export const createReminder = (data) => api.post('/reminders', data);

export default api;
```

---

## 4. Pages Implementation

### 4.1 Home Page (`pages/index.js`)

**Purpose**: Landing page with navigation to Users and Reminders

```javascript
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Voice Reminder Service</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/users" className="p-6 border rounded hover:bg-gray-100">
          <h2 className="text-2xl font-semibold">Manage Users</h2>
          <p>Create and view users</p>
        </Link>
        <Link href="/reminders" className="p-6 border rounded hover:bg-gray-100">
          <h2 className="text-2xl font-semibold">Manage Reminders</h2>
          <p>Create and view reminders</p>
        </Link>
      </div>
    </div>
  );
}
```

### 4.2 Users Page (`pages/users.js`)

**Features**:
- List all users
- Form to create new user

**Implementation Steps**:
1. Fetch users list on page load using `getUsers()`
2. Display users in a table/list
3. Include `CreateUserForm` component
4. Refresh list after successful user creation

### 4.3 Reminders Page (`pages/reminders.js`)

**Features**:
- Select a user to view their reminders
- Display reminders with status
- Form to create new reminder

**Implementation Steps**:
1. Fetch users list for dropdown
2. On user selection, fetch reminders using `getUserReminders(userId)`
3. Display reminders using `ReminderList` component
4. Include `CreateReminderForm` component
5. Show reminder status with color coding:
   - `scheduled`: Blue
   - `processing`: Yellow
   - `called`: Green
   - `failed`: Red

### 4.4 Reminder Detail Page (`pages/reminder/[id].js`)

**Features**:
- Show full reminder details
- Display current status
- Show call logs and transcripts (if available)

**Implementation Steps**:
1. Use Next.js dynamic routing to get reminder ID from URL
2. Fetch reminder details using `getReminder(id)`
3. Display all reminder fields
4. If `external_call_id` exists, fetch and display call logs
5. Show transcript if available

---

## 5. Components Implementation

### 5.1 CreateUserForm Component

**File**: `components/CreateUserForm.js`

**Features**:
- Email input field
- Validation (email format)
- Submit button
- Error/Success messages

**Required Functions**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  // Validate email
  // Call createUser API
  // Show success/error message
  // Reset form
  // Trigger parent refresh
};
```

### 5.2 CreateReminderForm Component

**File**: `components/CreateReminderForm.js`

**Features**:
- Select user (dropdown)
- Phone number input (with validation)
- Message textarea
- Scheduled date/time picker (ensure future date)
- Submit button
- Error/Success messages

**Validation Rules**:
- User must be selected
- Phone number format: E.164 format (e.g., +1234567890)
- Message: Required, max 500 characters
- Scheduled time: Must be in the future

### 5.3 ReminderList Component

**File**: `components/ReminderList.js`

**Features**:
- Display reminders in a table or cards
- Show: ID, phone number, message (truncated), scheduled time, status
- Click to view details (link to reminder detail page)
- Status badge with color coding

---

## 6. Styling with Tailwind CSS

Configure `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'status-scheduled': '#3b82f6',
        'status-processing': '#eab308',
        'status-called': '#22c55e',
        'status-failed': '#ef4444',
      },
    },
  },
  plugins: [],
};
```

Create `styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50;
}
```

Import in `pages/_app.js`:

```javascript
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
```

---

## 7. Development Workflow

### Step 1: Setup
```bash
cd Voice_Reminder/frontend
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```

Access at: `http://localhost:3000`

### Step 3: Implementation Order

1. **Setup Infrastructure**:
   - Install dependencies
   - Configure Tailwind CSS
   - Create `lib/api.js`

2. **Build Components** (bottom-up):
   - `CreateUserForm`
   - `CreateReminderForm`
   - `ReminderList`

3. **Build Pages** (simple to complex):
   - `index.js` (Home)
   - `users.js` (Users page)
   - `reminders.js` (Reminders page)
   - `reminder/[id].js` (Detail page)

4. **Testing**:
   - Test user creation
   - Test reminder creation
   - Test reminder listing
   - Test reminder detail view
   - Test status updates (after worker processes reminders)

---

## 8. Error Handling

Implement consistent error handling:

```javascript
try {
  const response = await createUser(email);
  setSuccess('User created successfully!');
} catch (error) {
  if (error.response) {
    setError(error.response.data.message || 'Server error');
  } else {
    setError('Network error - please check your connection');
  }
}
```

---

## 9. Best Practices

1. **State Management**: Use React hooks (`useState`, `useEffect`)
2. **Loading States**: Show loading indicators during API calls
3. **Form Validation**: Client-side validation before API calls
4. **Date/Time Handling**: Use native input type="datetime-local"
5. **Phone Number Format**: Validate E.164 format
6. **Responsive Design**: Use Tailwind responsive classes
7. **Accessibility**: Add proper labels, ARIA attributes

---

## 10. Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`: Backend API URL
4. Deploy

### Alternative: Netlify

1. Build the project: `npm run build`
2. Deploy the `.next` folder
3. Configure environment variables

---

## 11. Testing Checklist

- [ ] Home page loads correctly
- [ ] Can view users list
- [ ] Can create a new user with valid email
- [ ] User creation shows error for invalid email
- [ ] Can view reminders list for a user
- [ ] Can create a reminder with valid data
- [ ] Reminder creation validates phone number format
- [ ] Reminder creation validates future date
- [ ] Can view reminder detail page
- [ ] Reminder statuses display with correct colors
- [ ] Call logs and transcripts display (when available)
- [ ] All pages are responsive

---

## 12. Integration with Backend

Ensure backend API endpoints return data in expected formats:

**User Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "2025-12-10T00:00:00Z",
  "updatedAt": "2025-12-10T00:00:00Z"
}
```

**Reminder Response**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "phoneNumber": "+1234567890",
  "message": "Reminder message",
  "scheduledAt": "2025-12-10T15:00:00Z",
  "status": "scheduled",
  "externalCallId": null,
  "createdAt": "2025-12-10T00:00:00Z",
  "updatedAt": "2025-12-10T00:00:00Z"
}
```

---

## Summary

The frontend is a **Next.js application** that provides a minimal UI for:
1. Managing users (list, create)
2. Managing reminders (list, create, view details)
3. Viewing reminder statuses and call logs

Key technologies: **Next.js**, **React**, **Axios**, **Tailwind CSS**

Focus on **functionality over design**, ensure all features work correctly, and implement proper error handling and validation.
