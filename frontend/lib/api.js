import axios from 'axios';

// Get API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
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
export const getUserReminders = (userId, status = null) => {
  const params = status ? { status } : {};
  return api.get(`/users/${userId}/reminders`, { params });
};

export const getReminder = (id) => api.get(`/reminders/${id}`);

export const createReminder = (data) => api.post('/reminders', data);

// Export axios instance for custom requests
export default api;
