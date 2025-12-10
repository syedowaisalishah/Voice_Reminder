const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

module.exports = {
  async createUser(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email is required' });
      const user = await prisma.user.create({ data: { email }});
      return res.status(201).json(user);
    } catch (err) {
      logger.error({ err }, 'createUser error');
      if (err.code === 'P2002') return res.status(400).json({ error: 'email already exists' });
      next(err);
    }
  },

  async listUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }});
      res.json(users);
    } catch (err) {
      logger.error({ err }, 'listUsers error');
      next(err);
    }
  }
};
