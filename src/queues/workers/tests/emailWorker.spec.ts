import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from 'bullmq';
import { EmailTemplateError, EmailProviderError } from "@/services/errors/domainErrors";
import type { EmailJobData } from "@/queues/emailQueue";

// Tipos para os testes
interface TestJob extends Partial<Job<EmailJobData>> {
  id: string;
  data: EmailJobData;
  attemptsMade: number;
  opts: { attempts: number };
  processedOn?: number;
}

interface MockEmailService {
  execute: ReturnType<typeof vi.fn>;
}

interface MockLogger {
  child: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
}

// Setup global dos mocks
const mockEmailService: MockEmailService = {
  execute: vi.fn()
};

const mockLogger: MockLogger = {
  child: vi.fn().mockReturnThis(),
  info: vi.fn(),
  error: vi.fn()
};

const mockAuditService = {
  emailSent: vi.fn(),
  emailFailed: vi.fn()
};

// Mock das dependências
vi.mock("@/services/factories/shared/makeEmailService", () => ({
  makeEmailService: vi.fn(() => mockEmailService)
}));

vi.mock("@/lib/winston", () => ({
  logger: mockLogger
}));

vi.mock("@/services/logging/auditService", () => ({
  AuditService: mockAuditService
}));

vi.mock("@/lib/redis", () => ({
  redisConnection: {
    host: "localhost",
    port: 6379,
    db: 0
  }
}));

let emailProcessor: (job: TestJob) => Promise<unknown>;

vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation((name: string, processor: unknown) => {
    emailProcessor = processor as (job: TestJob) => Promise<unknown>;
    return {
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined)
    };
  })
}));

describe("EmailWorker", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset dos mocks
    mockEmailService.execute.mockReset();
    mockLogger.child.mockReturnThis();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockAuditService.emailSent.mockClear();
    mockAuditService.emailFailed.mockClear();
    
    // Importa o módulo após setup dos mocks
    await import("../emailWorker.js");
  });

  describe("Worker Configuration", () => {
    it("should configure worker correctly when imported", () => {
      // Verifica se o worker foi criado (através do mock function)
      expect(emailProcessor).toBeDefined();
      expect(typeof emailProcessor).toBe('function');
      
      expect(mockLogger.child).toHaveBeenCalledWith({ component: 'email-worker' });
    });
  });

  describe("Email Processing", () => {
    it("should process email successfully", async () => {
      const mockJob: TestJob = {
        id: "123",
        data: {
          to: "test@example.com",
          type: "email_confirmation",
          data: { name: "Test User" },
          userId: "user-123"
        },
        attemptsMade: 0, // Começa com 0, será incrementado para 1
        opts: { attempts: 3 },
        processedOn: Date.now()
      };

      mockEmailService.execute.mockResolvedValue({ messageId: "test-message-id" });

      const result = await emailProcessor(mockJob);

      expect(result).toEqual({ messageId: "test-message-id" });
      
      // O service espera { to, template, data } não { type, to, data }
      expect(mockEmailService.execute).toHaveBeenCalledWith({
        to: "test@example.com",
        template: "email_confirmation",
        data: { name: "Test User" }
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Processing email job",
        {
          jobId: "123",
          type: "email_confirmation",
          to: "test@example.com",
          attempt: 1, // attemptsMade + 1
          maxAttempts: 3
        }
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email sent successfully",
        {
          jobId: "123",
          type: "email_confirmation",
          to: "test@example.com",
          messageId: "test-message-id",
          attempt: 1
        }
      );

      expect(mockAuditService.emailSent).toHaveBeenCalledWith(
        "123",
        "email_confirmation",
        "test@example.com",
        "test-message-id"
      );
    });

    it("should handle missing processedOn field", async () => {
      const mockJob: TestJob = {
        id: "124",
        data: {
          to: "test2@example.com",
          type: "welcome",
          data: { name: "Test User 2" }
        },
        attemptsMade: 0,
        opts: { attempts: 3 }
        // processedOn não definido
      };

      mockEmailService.execute.mockResolvedValue({ messageId: "test-message-id-2" });

      const result = await emailProcessor(mockJob);

      expect(result).toEqual({ messageId: "test-message-id-2" });
      expect(mockEmailService.execute).toHaveBeenCalledWith({
        to: "test2@example.com",
        template: "welcome",
        data: { name: "Test User 2" }
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle EmailTemplateError correctly", async () => {
      const mockJob: TestJob = {
        id: "job-123",
        data: {
          to: "test@example.com",
          type: "invalid-template",
          data: {}
        },
        attemptsMade: 0,
        opts: { attempts: 3 }
      };

      const error = new EmailTemplateError("Template not found");
      mockEmailService.execute.mockRejectedValue(error);

      // EmailTemplateError retorna undefined em vez de lançar erro
      const result = await emailProcessor(mockJob);
      expect(result).toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        {
          jobId: "job-123",
          type: "invalid-template",
          to: "test@example.com",
          error: "Template not found",
          errorType: "EmailTemplateError",
          attempt: 1,
          maxAttempts: 3,
        }
      );

      expect(mockAuditService.emailFailed).toHaveBeenCalledWith(
        "job-123",
        "invalid-template",
        "test@example.com",
        "Template not found"
      );
    });

    it("should handle EmailProviderError correctly", async () => {
      const mockJob: TestJob = {
        id: "job-123",
        data: {
          to: "test@example.com",
          type: "welcome",
          data: { name: "Test" }
        },
        attemptsMade: 2, // Para que attempt seja 3
        opts: { attempts: 3 }
      };

      const error = new EmailProviderError("SMTP connection failed");
      mockEmailService.execute.mockRejectedValue(error);

      await expect(emailProcessor(mockJob)).rejects.toThrow("SMTP connection failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        {
          jobId: "job-123",
          type: "welcome",
          to: "test@example.com",
          error: "SMTP connection failed",
          errorType: "EmailProviderError",
          attempt: 3,
          maxAttempts: 3,
        }
      );

      expect(mockAuditService.emailFailed).toHaveBeenCalledWith(
        "job-123",
        "welcome",
        "test@example.com",
        "SMTP connection failed"
      );
    });

    it("should handle generic Error correctly", async () => {
      const mockJob: TestJob = {
        id: "job-123",
        data: {
          to: "test@example.com",
          type: "welcome",
          data: { name: "Test" }
        },
        attemptsMade: 2, // Para que attempt seja 3
        opts: { attempts: 3 }
      };

      const error = new Error("Unknown error");
      mockEmailService.execute.mockRejectedValue(error);

      await expect(emailProcessor(mockJob)).rejects.toThrow("Unknown error");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        {
          jobId: "job-123",
          type: "welcome",
          to: "test@example.com",
          error: "Unknown error",
          errorType: "Error",
          attempt: 3,
          maxAttempts: 3,
        }
      );

      expect(mockAuditService.emailFailed).toHaveBeenCalledWith(
        "job-123",
        "welcome",
        "test@example.com",
        "Unknown error"
      );
    });

    it("should handle unknown error type", async () => {
      const mockJob: TestJob = {
        id: "job-123",
        data: {
          to: "test@example.com",
          type: "welcome",
          data: { name: "Test" }
        },
        attemptsMade: 0, // Para que attempt seja 1
        opts: { attempts: 3 }
      };

      // Simula um erro que não é uma instância de Error
      mockEmailService.execute.mockRejectedValue("Unknown error");

      await expect(emailProcessor(mockJob)).rejects.toThrow("Unknown error");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        {
          jobId: "job-123",
          type: "welcome",
          to: "test@example.com",
          error: "Unknown error",
          errorType: "Unknown",
          attempt: 1,
          maxAttempts: 3,
        }
      );

      expect(mockAuditService.emailFailed).toHaveBeenCalledWith(
        "job-123",
        "welcome",
        "test@example.com",
        "Unknown error"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing job data gracefully", async () => {
      const mockJob: TestJob = {
        id: "job-456",
        data: null as unknown as EmailJobData,
        attemptsMade: 0,
        opts: { attempts: 3 },
      };

      // O erro vai acontecer na destructuring, então vai capturar na linha inicial
      await expect(emailProcessor(mockJob)).rejects.toThrow();
    });

    it("should handle job with missing options", async () => {
      const mockJob: TestJob = {
        id: "job-789",
        data: {
          to: "test@example.com",
          type: "welcome",
          data: { name: "Test" }
        },
        attemptsMade: 0,
        opts: null as unknown as { attempts: number }
      };

      const error = new Error("Test error");
      mockEmailService.execute.mockRejectedValue(error);

      await expect(emailProcessor(mockJob)).rejects.toThrow("Cannot read properties of null (reading 'attempts')");
    });

    it("should handle job with missing id", async () => {
      const mockJob: TestJob = {
        id: null as unknown as string,
        data: {
          to: "test@example.com",
          type: "welcome",
          data: { name: "Test" }
        },
        attemptsMade: 0,
        opts: { attempts: 3 }
      };

      const error = new Error("Test error");
      mockEmailService.execute.mockRejectedValue(error);

      await expect(emailProcessor(mockJob)).rejects.toThrow("Test error");

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        {
          jobId: null,
          type: "welcome",
          to: "test@example.com",
          error: "Test error",
          errorType: "Error",
          attempt: 1,
          maxAttempts: 3,
        }
      );

      expect(mockAuditService.emailFailed).toHaveBeenCalledWith(
        null,
        "welcome",
        "test@example.com",
        "Test error"
      );
    });
  });

  describe("Logging", () => {
    it("should log processing start for every job", async () => {
      const mockJob: TestJob = {
        id: "log-test-1",
        data: {
          to: "logger@example.com",
          type: "test-log",
          data: {}
        },
        attemptsMade: 1, // Para que attempt seja 2
        opts: { attempts: 3 }
      };

      mockEmailService.execute.mockResolvedValue({ messageId: "log-message-id" });

      await emailProcessor(mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Processing email job",
        {
          jobId: "log-test-1",
          type: "test-log",
          to: "logger@example.com",
          attempt: 2,
          maxAttempts: 3
        }
      );
    });

    it("should log success message with correct data", async () => {
      const mockJob: TestJob = {
        id: "log-test-2",
        data: {
          to: "success@example.com",
          type: "success-log",
          data: {}
        },
        attemptsMade: 1, // Para que attempt seja 2
        opts: { attempts: 3 }
      };

      mockEmailService.execute.mockResolvedValue({ messageId: "success-message-id" });

      await emailProcessor(mockJob);

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Email sent successfully",
        {
          jobId: "log-test-2",
          type: "success-log",
          to: "success@example.com",
          messageId: "success-message-id",
          attempt: 2
        }
      );
    });

    it("should log error details correctly", async () => {
      const mockJob: TestJob = {
        id: "log-test-3",
        data: {
          to: "error@example.com",
          type: "error-log",
          data: {}
        },
        attemptsMade: 1, // Para que attempt seja 2
        opts: { attempts: 3 }
      };

      const error = new EmailTemplateError("Logging test error");
      mockEmailService.execute.mockRejectedValue(error);

      // EmailTemplateError retorna undefined
      const result = await emailProcessor(mockJob);
      expect(result).toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Email sending failed",
        {
          jobId: "log-test-3",
          type: "error-log",
          to: "error@example.com",
          error: "Logging test error",
          errorType: "EmailTemplateError",
          attempt: 2,
          maxAttempts: 3,
        }
      );
    });
  });
});
