// Email service exports
export { EmailService } from './emailService';
export { EmailQueueService } from './emailQueueService';
export type { EmailTemplate } from './emailService';

// Email service interfaces
export type { 
  IEmailService, 
  SendEmailRequest, 
  SendEmailResponse,
  IEmailQueueService,
  QueueEmailRequest,
  QueueEmailResponse
} from '../interfaces';
