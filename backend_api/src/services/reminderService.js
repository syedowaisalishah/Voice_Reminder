const reminderRepo = require('../repositories/reminderRepo');
const userRepo = require('../repositories/userRepo');
const { isValidPhoneNumber, parseFutureDate } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Reminder Service - Contains all business logic for reminder operations
 */

/**
 * Create a new reminder
 * @param {Object} data - Reminder data
 * @param {string} data.user_id - User ID
 * @param {string} data.phone_number - Phone number in E.164 format
 * @param {string} data.message - Reminder message
 * @param {string} data.scheduled_at - ISO datetime string
 * @returns {Promise<Object>} Created reminder object
 * @throws {Error} If validation fails
 */
async function createReminder(data) {
  const { user_id, phone_number, message, scheduled_at } = data;

  // Validation: all required fields
  if (!user_id || !phone_number || !message || !scheduled_at) {
    const error = new Error('missing required fields: user_id, phone_number, message, scheduled_at');
    error.statusCode = 400;
    throw error;
  }

  // Validation: phone number format (E.164)
  if (!isValidPhoneNumber(phone_number)) {
    const error = new Error('invalid phone_number format. Must be E.164 format (e.g., +1234567890)');
    error.statusCode = 400;
    throw error;
  }

  // Validation: scheduled_at must be a future date
  const scheduledDate = parseFutureDate(scheduled_at);
  if (!scheduledDate) {
    const error = new Error('scheduled_at must be a valid future ISO datetime');
    error.statusCode = 400;
    throw error;
  }

  // Business rule: verify user exists
  const user = await userRepo.findById(user_id);
  if (!user) {
    const error = new Error('user not found');
    error.statusCode = 400;
    throw error;
  }

  // Create reminder with initial status 'scheduled'
  const reminderData = {
    userId: user_id,
    phoneNumber: phone_number,
    message,
    scheduledAt: scheduledDate,
    status: 'scheduled'
  };

  const reminder = await reminderRepo.create(reminderData);
  logger.info({ reminderId: reminder._id, userId: user_id }, 'reminder created');
  
  return reminder;
}

/**
 * Get reminder by ID with call logs
 * @param {string} id - Reminder ID
 * @returns {Promise<Object|null>} Reminder object with populated callLogs or null
 */
async function getReminderById(id) {
  if (!id) {
    const error = new Error('reminder id is required');
    error.statusCode = 400;
    throw error;
  }

  const reminder = await reminderRepo.findById(id);
  
  if (!reminder) {
    const error = new Error('reminder not found');
    error.statusCode = 404;
    throw error;
  }

  return reminder;
}

/**
 * Get reminders for a specific user with optional filters
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {string} options.status - Optional status filter
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 25)
 * @returns {Promise<Array>} List of reminders
 */
async function getRemindersByUser(userId, options = {}) {
  if (!userId) {
    const error = new Error('user id is required');
    error.statusCode = 400;
    throw error;
  }

  const { status, page = 1, pageSize = 25 } = options;

  // Build filter
  const filter = { userId };
  if (status) {
    // Validate status is one of the allowed values
    const validStatuses = ['scheduled', 'processing', 'called', 'failed'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`invalid status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    filter.status = status;
  }

  // Pagination options
  const paginationOptions = {
    skip: (page - 1) * pageSize,
    limit: parseInt(pageSize, 10)
  };

  return await reminderRepo.findByUserId(filter, paginationOptions);
}

/**
 * Update reminder status (used by worker and webhooks)
 * @param {string} id - Reminder ID
 * @param {string} status - New status
 * @param {string} externalCallId - Optional external call ID
 * @returns {Promise<Object>} Updated reminder
 */
async function updateReminderStatus(id, status, externalCallId = null) {
  if (!id || !status) {
    const error = new Error('reminder id and status are required');
    error.statusCode = 400;
    throw error;
  }

  const updateData = { status };
  if (externalCallId) {
    updateData.twilioCallSid = externalCallId;
  }

  const reminder = await reminderRepo.update(id, updateData);
  
  if (!reminder) {
    const error = new Error('reminder not found');
    error.statusCode = 404;
    throw error;
  }

  logger.info({ reminderId: id, status }, 'reminder status updated');
  return reminder;
}

module.exports = {
  createReminder,
  getReminderById,
  getRemindersByUser,
  updateReminderStatus
};
