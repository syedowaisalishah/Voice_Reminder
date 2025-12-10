// const pino = require('pino');

// const logger = pino({
//   transport: {
//     target: 'pino-pretty',
//     options: { colorize: true }
//   }
// });

// module.exports = logger;
module.exports = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};
