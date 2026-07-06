import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});

const shutdown = () => {
  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (error) => {
  logger.error(error);
  shutdown();
});

process.on('unhandledRejection', (reason) => {
  logger.error(reason);
  shutdown();
});
