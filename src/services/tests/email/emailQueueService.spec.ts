import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailQueueService } from "@/services/email/emailQueueService";
import { EmailQueueError } from "@/services/errors/domainErrors";
import { emailQueue } from "@/queues/emailQueue";
import { logger } from "@/lib/winston";
import { AuditService } from "@/services/logging/auditService";
import type { QueueEmailRequest } from "@/services/interfaces";

vi.mock("@/queues/emailQueue", () => ({
  emailQueue: {
    add: vi.fn(),
    getWaiting: vi.fn(),
    getActive: vi.fn(),
    getCompleted: vi.fn(),
    getFailed: vi.fn()
  }
}));

vi.mock("@/lib/winston", () => ({
  logger: {
    child: vi.fn().mockReturnThis(),
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("@/services/logging/auditService", () => ({
  AuditService: {
    emailQueued: vi.fn()
  }
}));

const mockEmailQueue = {
  add: vi.fn(),
  getWaiting: vi.fn(),
  getActive: vi.fn(),
  getCompleted: vi.fn(),
  getFailed: vi.fn()
};

const mockLogger = {
  info: vi.fn(),
  error: vi.fn()
};

const mockAuditService = {
  emailQueued: vi.fn()
};

vi.mocked(emailQueue).add = mockEmailQueue.add;
vi.mocked(emailQueue).getWaiting = mockEmailQueue.getWaiting;
vi.mocked(emailQueue).getActive = mockEmailQueue.getActive;
vi.mocked(emailQueue).getCompleted = mockEmailQueue.getCompleted;
vi.mocked(emailQueue).getFailed = mockEmailQueue.getFailed;

Object.assign(vi.mocked(logger), mockLogger);
Object.assign(vi.mocked(AuditService), mockAuditService);

let sut: EmailQueueService;

describe("EmailQueueService", () => {
  beforeEach(() => {
    sut = new EmailQueueService();
    vi.clearAllMocks();
  });

  describe("execute", () => {
    it("should add email job to queue successfully", async () => {
      const mockJob = { id: "job-123" };
      mockEmailQueue.add.mockResolvedValue(mockJob);
      
      const request: QueueEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: {
          name: "John Doe",
          userId: "user-123"
        },
        priority: 1,
        delay: 0
      };

      const result = await sut.execute(request);

      expect(result).toEqual({
        jobId: "job-123",
        success: true
      });
      
      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        "send-welcome",
        {
          type: "welcome",
          to: "test@example.com",
          data: {
            name: "John Doe",
            userId: "user-123"
          },
          userId: "user-123"
        },
        {
          delay: 0,
          priority: 1
        }
      );
      
      expect(mockLogger.info).toHaveBeenCalledWith("Email job added to queue", {
        jobId: "job-123",
        template: "welcome",
        to: "test@example.com",
        userId: "user-123",
        delay: 0,
        priority: 1
      });
      
      expect(mockAuditService.emailQueued).toHaveBeenCalledWith("job-123", "welcome", "user-123");
    });

    it("should throw EmailQueueError when queue operation fails", async () => {
      const queueError = new Error("Queue connection failed");
      mockEmailQueue.add.mockRejectedValue(queueError);
      
      const request: QueueEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: { name: "John Doe", userId: "user-123" }
      };

      await expect(sut.execute(request)).rejects.toThrow(EmailQueueError);
      await expect(sut.execute(request)).rejects.toThrow("Failed to queue email: Queue connection failed");
      
      expect(mockLogger.error).toHaveBeenCalledWith("Failed to add email job to queue", {
        template: "welcome",
        to: "test@example.com",
        error: "Queue connection failed"
      });
    });
  });

  describe("Helper Methods", () => {
    describe("sendWelcomeEmail", () => {
      it("should queue welcome email with correct priority", async () => {
        const mockJob = { id: "welcome-job-123" };
        mockEmailQueue.add.mockResolvedValue(mockJob);
        
        const userData = { name: "Jane Doe", userId: "user-456" };

        const result = await sut.sendWelcomeEmail("jane@example.com", userData);

        expect(result).toEqual({
          jobId: "welcome-job-123",
          success: true
        });
        
        expect(mockEmailQueue.add).toHaveBeenCalledWith(
          "send-welcome",
          expect.objectContaining({
            type: "welcome",
            to: "jane@example.com",
            data: userData
          }),
          expect.objectContaining({
            priority: 1
          })
        );
      });
    });

    describe("sendOrderConfirmation", () => {
      it("should queue order confirmation email with correct priority", async () => {

        const mockJob = { id: "order-job-123" };
        mockEmailQueue.add.mockResolvedValue(mockJob);
        
        const orderData = {
          orderId: "order-789",
          title: "Test Order",
          description: "Test Description",
          status: "PENDING",
          userId: "user-789"
        };

        const result = await sut.sendOrderConfirmation("customer@example.com", orderData);

        expect(result).toEqual({
          jobId: "order-job-123",
          success: true
        });
        
        expect(mockEmailQueue.add).toHaveBeenCalledWith(
          "send-order-confirmation",
          expect.objectContaining({
            type: "order-confirmation",
            to: "customer@example.com",
            data: orderData
          }),
          expect.objectContaining({
            priority: 2
          })
        );
      });
    });

    describe("sendPasswordReset", () => {
      it("should queue password reset email with correct priority", async () => {

        const mockJob = { id: "reset-job-123" };
        mockEmailQueue.add.mockResolvedValue(mockJob);
        
        const resetData = {
          name: "Bob Smith",
          resetLink: "https://example.com/reset?token=abc123",
          userId: "user-reset-123"
        };

        const result = await sut.sendPasswordReset("bob@example.com", resetData);

        expect(result).toEqual({
          jobId: "reset-job-123",
          success: true
        });
        
        expect(mockEmailQueue.add).toHaveBeenCalledWith(
          "send-password-reset",
          expect.objectContaining({
            type: "password-reset",
            to: "bob@example.com",
            data: resetData
          }),
          expect.objectContaining({
            priority: 3
          })
        );
      });
    });

    describe("sendAdminNotification", () => {
      it("should queue admin notification email with correct priority", async () => {

        const mockJob = { id: "admin-job-123" };
        mockEmailQueue.add.mockResolvedValue(mockJob);
        
        const adminData = {
          subject: "System Alert",
          event: "High CPU Usage",
          details: { cpu: "85%", memory: "70%" },
          timestamp: "2025-07-16T10:30:00Z"
        };

        const result = await sut.sendAdminNotification("admin@example.com", adminData);

        expect(result).toEqual({
          jobId: "admin-job-123",
          success: true
        });
        
        expect(mockEmailQueue.add).toHaveBeenCalledWith(
          "send-admin-notification",
          expect.objectContaining({
            type: "admin-notification",
            to: "admin@example.com",
            data: {
              ...adminData,
              userId: "system"
            }
          }),
          expect.objectContaining({
            priority: 5
          })
        );
      });
    });

    describe("scheduleEmail", () => {
      it("should schedule email with delay", async () => {
        const mockJob = { id: "scheduled-job-123" };
        mockEmailQueue.add.mockResolvedValue(mockJob);
        
        const delayMs = 60000;

        const result = await sut.scheduleEmail(
          "user@example.com",
          "welcome",
          { name: "Scheduled User", userId: "user-schedule-123" },
          delayMs
        );

        expect(result).toEqual({
          jobId: "scheduled-job-123",
          success: true
        });
        
        expect(mockEmailQueue.add).toHaveBeenCalledWith(
          "send-welcome",
          expect.objectContaining({
            type: "welcome",
            to: "user@example.com"
          }),
          expect.objectContaining({
            delay: delayMs
          })
        );
      });
    });
  });

  describe("Monitoring Methods", () => {
    describe("getQueueStats", () => {
      it("should return queue statistics", async () => {
        const mockWaiting = [{ id: "job1" }, { id: "job2" }];
        const mockActive = [{ id: "job3" }];
        const mockCompleted = [{ id: "job4" }, { id: "job5" }, { id: "job6" }];
        const mockFailed = [{ id: "job7" }];
        
        mockEmailQueue.getWaiting.mockResolvedValue(mockWaiting);
        mockEmailQueue.getActive.mockResolvedValue(mockActive);
        mockEmailQueue.getCompleted.mockResolvedValue(mockCompleted);
        mockEmailQueue.getFailed.mockResolvedValue(mockFailed);

        const stats = await sut.getQueueStats();

        expect(stats).toEqual({
          waiting: 2,
          active: 1,
          completed: 3,
          failed: 1
        });
      });

      it("should throw EmailQueueError when stats retrieval fails", async () => {
        const error = new Error("Queue stats error");
        mockEmailQueue.getWaiting.mockRejectedValue(error);

        await expect(sut.getQueueStats()).rejects.toThrow(EmailQueueError);
        await expect(sut.getQueueStats()).rejects.toThrow("Failed to get queue statistics");
      });
    });

    describe("getPendingJobs", () => {
      it("should return pending jobs", async () => {
        const mockJobs = [
          { id: "job1", data: { type: "welcome" }, opts: { priority: 1 } },
          { id: "job2", data: { type: "order-confirmation" }, opts: { priority: 2 } }
        ];
        mockEmailQueue.getWaiting.mockResolvedValue(mockJobs);

        const jobs = await sut.getPendingJobs();

        expect(jobs).toEqual([
          { id: "job1", data: { type: "welcome" }, opts: { priority: 1 } },
          { id: "job2", data: { type: "order-confirmation" }, opts: { priority: 2 } }
        ]);
      });

      it("should throw EmailQueueError when pending jobs retrieval fails", async () => {
        const error = new Error("Pending jobs error");
        mockEmailQueue.getWaiting.mockRejectedValue(error);

        await expect(sut.getPendingJobs()).rejects.toThrow(EmailQueueError);
        await expect(sut.getPendingJobs()).rejects.toThrow("Failed to get pending jobs");
      });
    });

    describe("getFailedJobs", () => {
      it("should return failed jobs", async () => {
        const mockJobs = [
          { 
            id: "failed-job1", 
            data: { type: "welcome" }, 
            failedReason: "SMTP error",
            processedOn: 1642694400000
          }
        ];
        mockEmailQueue.getFailed.mockResolvedValue(mockJobs);

        const jobs = await sut.getFailedJobs();

        expect(jobs).toEqual([
          { 
            id: "failed-job1", 
            data: { type: "welcome" }, 
            failedReason: "SMTP error",
            processedOn: 1642694400000
          }
        ]);
      });

      it("should throw EmailQueueError when failed jobs retrieval fails", async () => {
        const error = new Error("Failed jobs error");
        mockEmailQueue.getFailed.mockRejectedValue(error);

        await expect(sut.getFailedJobs()).rejects.toThrow(EmailQueueError);
        await expect(sut.getFailedJobs()).rejects.toThrow("Failed to get failed jobs");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle non-Error objects thrown by queue operations", async () => {

      mockEmailQueue.add.mockRejectedValue("String error");
      
      const request: QueueEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: { name: "John Doe", userId: "user-123" }
      };

      await expect(sut.execute(request)).rejects.toThrow(EmailQueueError);
      await expect(sut.execute(request)).rejects.toThrow("Failed to queue email: Unknown error");
    });

    it("should log errors with proper context", async () => {
      const error = new Error("Queue operation failed");
      mockEmailQueue.add.mockRejectedValue(error);
      
      const request: QueueEmailRequest = {
        to: "test@example.com",
        template: "welcome",
        data: { name: "John Doe", userId: "user-123" }
      };

      try {
        await sut.execute(request);
      } catch {

      }

      expect(mockLogger.error).toHaveBeenCalledWith("Failed to add email job to queue", {
        template: "welcome",
        to: "test@example.com",
        error: "Queue operation failed"
      });
    });
  });
});
