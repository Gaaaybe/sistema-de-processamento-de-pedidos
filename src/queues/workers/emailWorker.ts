import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';
import { makeEmailService } from '@/services/factories/shared/makeEmailService';
import { logger } from '@/lib/winston';
import { AuditService } from '@/services/logging/auditService';
import { EmailTemplateError, EmailProviderError } from '@/services/errors/domainErrors';
import type { EmailJobData } from '@/queues/emailQueue';

const emailLogger = logger.child({ component: 'email-worker' });
const emailService = makeEmailService();

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job) => {
    const { id, data } = job;
    const { type, to, data: emailData } = data;
    
    emailLogger.info('Processing email job', {
      jobId: id,
      type,
      to,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
    });

    try {
      const result = await emailService.execute({
        to,
        template: type,
        data: emailData,
      });
      
      emailLogger.info('Email sent successfully', {
        jobId: id,
        type,
        to,
        messageId: result.messageId,
        attempt: job.attemptsMade + 1,
      });

      AuditService.emailSent(id as string, type, to, result.messageId);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      emailLogger.error('Email sending failed', {
        jobId: id,
        type,
        to,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
      });

      AuditService.emailFailed(id as string, type, to, errorMessage);
      
      if (error instanceof EmailTemplateError) {
        emailLogger.error('Template error - job will not retry', {
          jobId: id,
          type,
          error: errorMessage
        });
        return;
      }
      
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Processa até 5 emails simultâneos
  }
);

emailWorker.on('completed', (job) => {
  const startTime = job.processedOn || Date.now();
  emailLogger.info('Email job completed', {
    jobId: job.id,
    type: job.data.type,
    to: job.data.to,
    duration: `${Date.now() - startTime}ms`,
  });
});

emailWorker.on('failed', (job, err) => {
  emailLogger.error('Email job failed', {
    jobId: job?.id,
    type: job?.data?.type,
    to: job?.data?.to,
    error: err.message,
    attempt: job?.attemptsMade,
    maxAttempts: job?.opts?.attempts,
  });
});

emailWorker.on('error', (err) => {
  emailLogger.error('Email worker error', { error: err.message });
});

process.on('SIGTERM', async () => {
  emailLogger.info('Shutting down email worker...');
  await emailWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  emailLogger.info('Shutting down email worker...');
  await emailWorker.close();
  process.exit(0);
});

emailLogger.info('Email worker started successfully', {
  concurrency: 5,
  redis: {
    host: redisConnection.host,
    port: redisConnection.port,
    db: redisConnection.db,
  },
});
