import { EmailQueueService } from '@/services/email/emailQueueService';
import type { IEmailQueueService } from '@/services/interfaces';

export function makeEmailQueueService(): IEmailQueueService {
  const emailQueueService = new EmailQueueService();
  return emailQueueService;
}
