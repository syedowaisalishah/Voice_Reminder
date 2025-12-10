const prisma = require('../config/db');

/**
 * Get due reminders that need to be processed
 */
async function getDueReminders(limit = 50) {
  return await prisma.reminder.findMany({
    where: {
      scheduledAt: { lte: new Date() },
      status: 'scheduled'
    },
    take: limit,
    orderBy: {
      scheduledAt: 'asc'
    }
  });
}

/**
 * Update reminder status
 */
async function updateReminderStatus(id, status, externalCallId = null) {
  return await prisma.reminder.update({
    where: { id },
    data: { 
      status,
      ...(externalCallId && { externalCallId }),
      updatedAt: new Date()
    }
  });
}

/**
 * Find reminder by ID
 */
async function findReminderById(id) {
  return await prisma.reminder.findUnique({
    where: { id }
  });
}

module.exports = {
  getDueReminders,
  updateReminderStatus,
  findReminderById
};
