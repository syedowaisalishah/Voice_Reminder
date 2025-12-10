const userRepo = require('../repositories/userRepo');
const logger = require('../utils/logger');

/**
 * User Service - Contains all business logic for user operations
 */

/**
 * Create a new user
 * @param {string} email - User email address
 * @returns {Promise<Object>} Created user object
 * @throws {Error} If email is invalid or already exists
 */
async function createUser(email) {
  // Validation: email is required
  if (!email || typeof email !== 'string') {
    const error = new Error('email is required');
    error.statusCode = 400;
    throw error;
  }

  // Validation: email format
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('invalid email format');
    error.statusCode = 400;
    throw error;
  }

  try {
    // Create user via repository
    const user = await userRepo.create(email);
    logger.info({ userId: user._id, email: user.email }, 'user created');
    return user;
  } catch (err) {
    // Handle duplicate email error from MongoDB
    if (err.code === 11000) {
      const error = new Error('email already exists');
      error.statusCode = 400;
      throw error;
    }
    // Re-throw other errors
    throw err;
  }
}

/**
 * Get all users
 * @returns {Promise<Array>} List of all users
 */
async function getAllUsers() {
  return await userRepo.findAll();
}

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(id) {
  if (!id) {
    const error = new Error('user id is required');
    error.statusCode = 400;
    throw error;
  }
  
  return await userRepo.findById(id);
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById
};
