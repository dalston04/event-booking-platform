import { Queue, JobsOptions } from 'bullmq';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export interface EmailJobData {
  type: 'BOOKING_CONFIRMATION' | 'WAITLIST_NOTIFICATION' | 'WELCOME_EMAIL';
  to: string;
  subject: string;
  payload: Record<string, unknown>;
}

export const EMAIL_QUEUE_NAME = 'email-notifications-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

/**
 * Enqueues an email job into the Redis background processing queue
 */
export async function addEmailJob(
  name: string,
  data: EmailJobData,
  opts?: JobsOptions,
): Promise<void> {
  try {
    await emailQueue.add(name, data, opts);
    logger.info(`[Email Queue]: Enqueued job [${name}] for recipient [${data.to}]`);
  } catch (err) {
    logger.error(err, `[Email Queue Error]: Failed to enqueue job [${name}]`);
  }
}
