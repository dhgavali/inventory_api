const { PrismaClient } = require('@prisma/client');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

const prisma = new PrismaClient();

let server;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to MySQL database');

    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

const exitHandler = async () => {
  try {
    if (server) {
      server.close(async () => {
        logger.info('Server closed');

        await prisma.$disconnect();
        logger.info('Database connection closed');

        process.exit(1);
      });
    } else {
      await prisma.$disconnect();
      process.exit(1);
    }
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

const unexpectedErrorHandler = async (error) => {
  logger.error('Unexpected error:', error);
  await exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    });
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    });
  }
});
