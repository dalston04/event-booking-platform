import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.config.js';
import { logger } from './utils/logger.js';
import { emailWorker } from './jobs/email.worker.js';
import { initSocketServer } from './socket/socket.server.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO Realtime Gateway
initSocketServer(server);

server.listen(env.PORT, () => {
  logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
  logger.info(`🏥 Health check: http://localhost:${env.PORT}/api/v1/health`);
  logger.info('⚡ Socket.IO Realtime Gateway active.');
  logger.info('⚙️ BullMQ background workers initialized.');
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Closing BullMQ worker & HTTP server...');
  await emailWorker.close();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
