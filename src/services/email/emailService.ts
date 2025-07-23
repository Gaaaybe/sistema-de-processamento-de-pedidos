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
        <p>Olá, ${data.userName}!</p>
        <p>Seu pedido foi criado com sucesso e está sendo processado.</p>
        <h2>Detalhes do Pedido:</h2>
        <ul>
          <li><strong>ID:</strong> ${data.orderId}</li>
          <li><strong>Título:</strong> ${data.title}</li>
          <li><strong>Descrição:</strong> ${data.description}</li>
          <li><strong>Status:</strong> ${data.status}</li>
        </ul>
        ${data.imageUrl ? `<p><strong>Imagem:</strong> <a href="${data.imageUrl}">Ver imagem</a></p>` : ''}
        <p>Você receberá atualizações sobre o status do seu pedido.</p>
        <hr>
        <p>Equipe Sistema de Pedidos</p>
      `,
      text: `Olá, ${data.userName}! Pedido ${data.orderId} criado com sucesso! Título: ${data.title}, Status: ${data.status}`
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
    
    'order-status-update': (data) => {
      const statusMessages = {
        approved: {
          title: '✅ Pedido Aprovado!',
          message: 'Temos uma ótima notícia! Seu pedido foi aprovado.',
          color: '#28a745',
          nextSteps: 'Agora seu pedido entrará em processamento. Você receberá mais atualizações em breve.'
        },
        rejected: {
          title: '❌ Pedido Rejeitado',
          message: 'Infelizmente, seu pedido não pôde ser aprovado.',
          color: '#dc3545',
          nextSteps: 'Você pode revisar os detalhes e enviar um novo pedido se desejar.'
        },
        processing: {
          title: '⏳ Pedido em Processamento',
          message: 'Seu pedido está sendo processado.',
          color: '#17a2b8',
          nextSteps: 'Estamos trabalhando no seu pedido. Aguarde novas atualizações.'
        }
      };

      const statusInfo = statusMessages[data.status as keyof typeof statusMessages] || {
        title: '📋 Status do Pedido Atualizado',
        message: `Status do seu pedido foi atualizado para: ${data.status}`,
        color: '#6c757d',
        nextSteps: 'Acompanhe as atualizações do seu pedido.'
      };

      return {
        subject: `${statusInfo.title} - Pedido ${data.orderId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">${statusInfo.title}</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 18px; margin-bottom: 20px;">Olá, ${data.userName}!</p>
              
              <p style="font-size: 16px; margin-bottom: 25px;">${statusInfo.message}</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${statusInfo.color};">
                <h2 style="margin-top: 0; color: #333; font-size: 18px;">📋 Detalhes do Pedido</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">ID do Pedido:</td>
                    <td style="padding: 8px 0;">${data.orderId}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Título:</td>
                    <td style="padding: 8px 0;">${data.title}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Status Atual:</td>
                    <td style="padding: 8px 0;">
                      <span style="background-color: ${statusInfo.color}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: bold;">
                        ${String(data.status || '').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #555;">Data da Atualização:</td>
                    <td style="padding: 8px 0;">${data.updatedAt || new Date().toLocaleString('pt-BR')}</td>
                  </tr>
                  ${data.adminName ? `
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px 0; font-weight: bold; color: #555;">Processado por:</td>
                      <td style="padding: 8px 0;">${data.adminName}</td>
                    </tr>
                  ` : ''}
                </table>
              </div>
              
              ${data.reason ? `
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                  <h3 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">💬 Observações</h3>
                  <p style="margin: 0; color: #856404; font-style: italic;">"${data.reason}"</p>
                </div>
              ` : ''}
              
              <div style="background-color: #e7f3ff; border: 1px solid #b3d7ff; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #004085; font-size: 16px;">🔄 Próximos Passos</h3>
                <p style="margin: 0; color: #004085;">${statusInfo.nextSteps}</p>
              </div>
              
              ${data.imageUrl ? `
                <div style="text-align: center; margin-bottom: 25px;">
                  <p style="margin-bottom: 10px; color: #555;">📷 Imagem do Pedido:</p>
                  <a href="${data.imageUrl}" style="color: ${statusInfo.color}; text-decoration: none; font-weight: bold;">
                    Ver Imagem Anexada
                  </a>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6c757d; font-size: 14px; margin: 0;">
                  Dúvidas? Entre em contato conosco através do nosso suporte.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px; border-top: 1px solid #eee;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Sistema de Pedidos - Todos os direitos reservados</p>
              <p style="margin: 5px 0 0 0;">Este é um email automático, não responda a esta mensagem.</p>
            </div>
          </div>
        `,
        text: `
${statusInfo.title} - Pedido ${data.orderId}

Olá, ${data.userName}!

${statusInfo.message}

DETALHES DO PEDIDO:
- ID: ${data.orderId}
- Título: ${data.title}
- Status: ${String(data.status || '').toUpperCase()}
- Atualizado em: ${data.updatedAt || new Date().toLocaleString('pt-BR')}
${data.adminName ? `- Processado por: ${data.adminName}` : ''}

${data.reason ? `OBSERVAÇÕES: "${data.reason}"` : ''}

PRÓXIMOS PASSOS: ${statusInfo.nextSteps}

${data.imageUrl ? `Imagem: ${data.imageUrl}` : ''}

---
Sistema de Pedidos
Este é um email automático, não responda a esta mensagem.
        `
      };
    },

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
