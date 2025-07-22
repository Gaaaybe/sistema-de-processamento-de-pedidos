import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailService } from "@/services/email/emailService";
import { EmailServiceError, EmailTemplateError, EmailProviderError } from "@/services/errors/domainErrors";
import { mailTransporter } from "@/lib/mail";
import { logger } from "@/lib/winston";
import type { SendEmailRequest } from "@/services/interfaces";

vi.mock("@/lib/mail", () => ({
  mailTransporter: {
    sendMail: vi.fn()
  }
}));

vi.mock("@/lib/winston", () => ({
  logger: {
    child: vi.fn().mockReturnThis(),
    info: vi.fn(),
    error: vi.fn()
  }
}));

const mockMailTransporter = vi.mocked(mailTransporter);
const mockLogger = vi.mocked(logger);

let sut: EmailService;

describe("EmailService", () => {
  beforeEach(() => {
    sut = new EmailService();
    vi.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should send welcome email successfully", async () => {
      const mockResult = { messageId: "test-message-id" };
      mockMailTransporter.sendMail = vi.fn().mockResolvedValue(mockResult);
      
      const request: SendEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: {
          name: "John Doe",
          userId: "user-123"
        }
      };

      const result = await sut.execute(request);

      expect(result).toEqual({
        messageId: "test-message-id",
        success: true
      });
      
      expect(mockMailTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: "test@example.com",
        subject: "Bem-vindo ao Sistema de Pedidos, John Doe!",
        html: expect.stringContaining("<h1>Bem-vindo, John Doe!</h1>"),
        text: expect.stringContaining("Bem-vindo, John Doe!")
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith("Sending email", {
        to: "test@example.com",
        template: "welcome",
        userId: "user-123"
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith("Email sent successfully", {
        messageId: "test-message-id",
        to: "test@example.com",
        template: "welcome",
        userId: "user-123"
      });
    });

    it("should send order confirmation email successfully", async () => {
      const mockResult = { messageId: "order-message-id" };
      mockMailTransporter.sendMail = vi.fn().mockResolvedValue(mockResult);
      
      const request: SendEmailRequest = {
        to: "customer@example.com",
        template: "order-confirmation",
        data: {
          orderId: "order-123",
          title: "Test Order",
          description: "Test Description",
          status: "PENDING",
          userId: "user-456"
        }
      };

      const result = await sut.execute(request);

      expect(result).toEqual({
        messageId: "order-message-id",
        success: true
      });
      
      expect(mockMailTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: "customer@example.com",
        subject: "Pedido order-123 criado com sucesso!",
        html: expect.stringContaining("<h1>Pedido Criado com Sucesso!</h1>"),
        text: expect.stringContaining("Pedido order-123 criado com sucesso!")
      });
    });

    it("should send password reset email successfully", async () => {
      const mockResult = { messageId: "reset-message-id" };
      mockMailTransporter.sendMail = vi.fn().mockResolvedValue(mockResult);
      
      const request: SendEmailRequest = {
        to: "user@example.com",
        template: "password-reset",
        data: {
          name: "Jane Doe",
          resetLink: "https://example.com/reset?token=abc123",
          userId: "user-789"
        }
      };

      const result = await sut.execute(request);

      expect(result).toEqual({
        messageId: "reset-message-id",
        success: true
      });
      
      expect(mockMailTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: "user@example.com",
        subject: "Redefinição de Senha - Sistema de Pedidos",
        html: expect.stringContaining('href="https://example.com/reset?token=abc123"'),
        text: expect.stringContaining("https://example.com/reset?token=abc123")
      });
    });

    it("should send admin notification email successfully", async () => {
      const mockResult = { messageId: "admin-message-id" };
      mockMailTransporter.sendMail = vi.fn().mockResolvedValue(mockResult);
      
      const request: SendEmailRequest = {
        to: "admin@example.com",
        template: "admin-notification",
        data: {
          subject: "System Alert",
          event: "User Registration",
          details: { userId: "new-user-123", action: "created" },
          timestamp: "2025-07-16T10:30:00Z"
        }
      };

      const result = await sut.execute(request);

      expect(result).toEqual({
        messageId: "admin-message-id",
        success: true
      });
      
      expect(mockMailTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: "admin@example.com",
        subject: "[ADMIN] System Alert",
        html: expect.stringContaining("<h1>Notificação do Sistema</h1>"),
        text: expect.stringContaining("[ADMIN] System Alert")
      });
    });
  });

  describe("Error Scenarios", () => {
    it("should throw EmailTemplateError when template does not exist", async () => {
      const request: SendEmailRequest = {
        to: "test@example.com",
        template: "non-existent-template",
        data: { userId: "user-123" }
      };

      await expect(sut.execute(request)).rejects.toThrow(EmailTemplateError);
      await expect(sut.execute(request)).rejects.toThrow("Template 'non-existent-template' not found");
      
      expect(mockMailTransporter.sendMail).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to send email", {
        to: "test@example.com",
        template: "non-existent-template",
        error: "Template 'non-existent-template' not found",
        userId: "user-123"
      });
    });

    it("should throw EmailProviderError when SMTP connection fails", async () => {
      const smtpError = new Error("SMTP connection failed");
      mockMailTransporter.sendMail = vi.fn().mockRejectedValue(smtpError);
      
      const request: SendEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: { name: "John Doe", userId: "user-123" }
      };

      await expect(sut.execute(request)).rejects.toThrow(EmailProviderError);
      await expect(sut.execute(request)).rejects.toThrow("SMTP provider error: SMTP connection failed");
      
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to send email", {
        to: "test@example.com",
        template: "welcome",
        error: "SMTP connection failed",
        userId: "user-123"
      });
    });

    it("should throw EmailServiceError for generic errors", async () => {
      const genericError = new Error("Unknown error occurred");
      mockMailTransporter.sendMail = vi.fn().mockRejectedValue(genericError);
      
      const request: SendEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: { name: "John Doe", userId: "user-123" }
      };

      await expect(sut.execute(request)).rejects.toThrow(EmailServiceError);
      await expect(sut.execute(request)).rejects.toThrow("Failed to send email: Unknown error occurred");
    });

  });

  describe("Template Rendering", () => {
    it("should render welcome template with correct data", async () => {
      const mockResult = { messageId: "test-id" };
      mockMailTransporter.sendMail = vi.fn().mockResolvedValue(mockResult);
      
      const request: SendEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: {
          name: "Maria Silva",
          userId: "user-456"
        }
      };

      await sut.execute(request);

      expect(mockMailTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.SMTP_FROM_EMAIL,
        to: "test@example.com",
        subject: "Bem-vindo ao Sistema de Pedidos, Maria Silva!",
        html: expect.stringContaining("Bem-vindo, Maria Silva!"),
        text: expect.stringContaining("Bem-vindo, Maria Silva!")
      });
    });
  });
});
