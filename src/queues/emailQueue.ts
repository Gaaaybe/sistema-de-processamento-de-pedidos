import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/redis';

export interface EmailJobData {
  type: string;
  to: string;
  data: Record<string, unknown>;
  userId?: string;
}

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

emailQueue.on('error', (error) => {
  console.error('❌ Email queue error:', error);
});

emailQueue.on('waiting', (job) => {
  console.log(`📧 Email job waiting: ${job.id}`);
});
