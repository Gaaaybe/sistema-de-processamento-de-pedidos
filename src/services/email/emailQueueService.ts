import { emailQueue, type EmailJobData } from '@/queues/emailQueue';
import { logger } from '@/lib/winston';
import { AuditService } from '@/services/logging/auditService';
import { EmailQueueError } from '@/services/errors/domainErrors';
import type { 
  IEmailQueueService, 
  QueueEmailRequest, 
  QueueEmailResponse 
} from '../interfaces';

export class EmailQueueService implements IEmailQueueService {
  async execute({ to, template, data, priority = 0, delay = 0 }: QueueEmailRequest): Promise<QueueEmailResponse> {
    try {
      const jobData: EmailJobData = {
        type: template,
        to,
        data,
        userId: data.userId as string || undefined,
      };

      const job = await emailQueue.add(
        `send-${template}`,
        jobData,
        {
          delay,
          priority,
        }
      );

      logger.info('Email job added to queue', {
        jobId: job.id,
        template,
        to,
        userId: jobData.userId,
        delay,
        priority,
      });

      AuditService.emailQueued(job.id as string, template, jobData.userId);

      return {
        jobId: job.id as string,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to add email job to queue', {
        template,
        to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new EmailQueueError(`Failed to queue email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendWelcomeEmail(to: string, userData: { name: string; userId: string }) {
    return this.execute({
      to,
      template: 'welcome',
      data: userData,
      priority: 1,
    });
  }

  async sendOrderConfirmation(to: string, orderData: { orderId: string; title: string; description: string; status: string; userId: string }) {
    return this.execute({
      to,
      template: 'order-confirmation',
      data: orderData,
      priority: 2,
    });
  }

  async sendPasswordReset(to: string, resetData: { name: string; resetLink: string; userId: string }) {
    return this.execute({
      to,
      template: 'password-reset',
      data: resetData,
      priority: 3,
    });
  }

  async sendAdminNotification(to: string, adminData: { subject: string; event: string; details: Record<string, unknown>; timestamp: string }) {
    return this.execute({
      to,
      template: 'admin-notification',
      data: {
        ...adminData,
        userId: 'system',
      },
      priority: 5,
    });
  }

  async sendOrderStatusUpdate(to: string, statusData: { 
    userName: string; 
    orderId: string; 
    title: string; 
    status: string; 
    userId: string;
    updatedAt?: string;
    adminName?: string;
    reason?: string;
    imageUrl?: string;
  }) {
    return this.execute({
      to,
      template: 'order-status-update',
      data: {
        ...statusData,
        updatedAt: statusData.updatedAt || new Date().toLocaleString('pt-BR'),
      },
      priority: 2, // Alta prioridade para notificações de status
    });
  }

  async scheduleEmail(to: string, template: string, data: Record<string, unknown>, delayInMs: number) {
    return this.execute({
      to,
      template,
      data,
      delay: delayInMs,
    });
  }

  async getQueueStats() {
    try {
      const waiting = await emailQueue.getWaiting();
      const active = await emailQueue.getActive();
      const completed = await emailQueue.getCompleted();
      const failed = await emailQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      logger.error('Failed to get queue stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new EmailQueueError('Failed to get queue statistics');
    }
  }

  async getPendingJobs() {
    try {
      const jobs = await emailQueue.getWaiting();
      return jobs.map(job => ({
        id: job.id,
        data: job.data as unknown as Record<string, unknown>,
        opts: job.opts as Record<string, unknown>,
      }));
    } catch (error) {
      logger.error('Failed to get pending jobs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new EmailQueueError('Failed to get pending jobs');
    }
  }

  async getFailedJobs() {
    try {
      const jobs = await emailQueue.getFailed();
      return jobs.map(job => ({
        id: job.id,
        data: job.data as unknown as Record<string, unknown>,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
      }));
    } catch (error) {
      logger.error('Failed to get failed jobs', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new EmailQueueError('Failed to get failed jobs');
    }
  }
}
