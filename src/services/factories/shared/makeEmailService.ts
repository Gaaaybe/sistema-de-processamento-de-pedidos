import { EmailService } from '@/services/email/emailService';
import type { IEmailService } from '@/services/interfaces';

export function makeEmailService(): IEmailService {
  const emailService = new EmailService();
  return emailService;
}
