import { mailTransporter } from '@/lib/mail';
import { logger } from '@/lib/winston';
import { EmailServiceError, EmailTemplateError, EmailProviderError } from '@/services/errors/domainErrors';
import type { 
  IEmailService, 
  SendEmailRequest, 
  SendEmailResponse 
} from '../interfaces';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService implements IEmailService {
  private readonly emailTemplates: Record<string, (data: Record<string, unknown>) => EmailTemplate> = {
    'welcome': (data) => ({
      subject: `Bem-vindo ao Sistema de Pedidos, ${data.name}!`,
      html: `
        <h1>Bem-vindo, ${data.name}!</h1>
        <p>Obrigado por se cadastrar no nosso sistema de pedidos.</p>
        <p>Agora você pode fazer pedidos e acompanhar o status deles.</p>
        <hr>
        <p>Equipe Sistema de Pedidos</p>
      `,
      text: `Bem-vindo, ${data.name}! Obrigado por se cadastrar no nosso sistema de pedidos.`
    }),
    
    'order-confirmation': (data) => ({
      subject: `Pedido ${data.orderId} criado com sucesso!`,
      html: `
        <h1>Pedido Criado com Sucesso!</h1>
        <p>Seu pedido foi criado com sucesso e está sendo processado.</p>
        <h2>Detalhes do Pedido:</h2>
        <ul>
          <li><strong>ID:</strong> ${data.orderId}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Descrição:</strong> ${data.description}</li>
          <li><strong>Status:</strong> ${data.status}</li>
        </ul>
        <p>Você receberá atualizações sobre o status do seu pedido.</p>
        <hr>
        <p>Equipe Sistema de Pedidos</p>
      `,
      text: `Pedido ${data.orderId} criado com sucesso! Título: ${data.title}, Status: ${data.status}`
    }),
    
    'password-reset': (data) => ({
      subject: 'Redefinição de Senha - Sistema de Pedidos',
      html: `
        <h1>Redefinição de Senha</h1>
        <p>Olá, ${data.name}!</p>
        <p>Você solicitou uma redefinição de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${data.resetLink}">Redefinir Senha</a>
        <p>Se você não solicitou essa redefinição, ignore este email.</p>
        <p>Este link expira em 1 hora.</p>
        <hr>
        <p>Equipe Sistema de Pedidos</p>
      `,
      text: `Redefinição de senha. Link: ${data.resetLink}`
    }),
    
    'admin-notification': (data) => ({
      subject: `[ADMIN] ${data.subject}`,
      html: `
        <h1>Notificação do Sistema</h1>
        <p><strong>Evento:</strong> ${data.event}</p>
        <p><strong>Detalhes:</strong></p>
        <pre>${JSON.stringify(data.details, null, 2)}</pre>
        <p><strong>Timestamp:</strong> ${data.timestamp}</p>
        <hr>
        <p>Sistema de Pedidos - Notificação Automática</p>
      `,
      text: `[ADMIN] ${data.subject} - ${data.event}`
    })
  };

  async execute({ to, template, data }: SendEmailRequest): Promise<SendEmailResponse> {
    logger.info('Sending email', { to, template, userId: data.userId });

    try {
      const templateFn = this.emailTemplates[template];
      if (!templateFn) {
        throw new EmailTemplateError(`Template '${template}' not found`);
      }

      const emailContent = templateFn(data);
      
      const result = await mailTransporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to,
        template,
        userId: data.userId,
      });

      return {
        messageId: result.messageId,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to send email', {
        to,
        template,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: data.userId,
      });

      if (error instanceof EmailTemplateError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('SMTP') || error.message.includes('connection')) {
          throw new EmailProviderError(`SMTP provider error: ${error.message}`);
        }
      }

      throw new EmailServiceError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
