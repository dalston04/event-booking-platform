import pino from 'pino';
import { env } from '../config/env.config.js';

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});
