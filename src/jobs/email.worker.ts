import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, EmailJobData } from '../queues/email.queue.js';
import { env } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

const isProduction = env.NODE_ENV === 'production' || env.REDIS_HOST.includes('upstash.io');

/**
 * Background Email Worker Consumer
 * Processes asynchronous jobs from Redis queue
 */
export const emailWorker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,
  async (job: Job<EmailJobData>) => {
    logger.info(`[Email Worker]: Processing job [ID: ${job.id}] - Type: [${job.data.type}]`);

    // Simulate sending email via SMTP provider (SendGrid / Mailgun)
    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info(`[Email Worker]: Successfully sent email to [${job.data.to}] | Subject: "${job.data.subject}"`);
  },
  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      tls: isProduction ? {} : undefined, // Enable TLS for Upstash cloud Redis
    },
    concurrency: 5,
  },
);

emailWorker.on('completed', (job) => {
  logger.info(`[Email Worker]: Job [ID: ${job.id}] completed successfully.`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(err, `[Email Worker Error]: Job [ID: ${job?.id}] failed. Attempt [${job?.attemptsMade}/${job?.opts.attempts}]`);
});

emailWorker.on('error', (err) => {
  logger.warn(`[BullMQ Worker Notice]: Redis queue connection unavailable (${err.message})`);
});
