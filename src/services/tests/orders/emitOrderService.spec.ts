import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmitOrderService } from "@/services/orders/emitOrderService";
import { OrderAlreadyExistsError } from "@/services/errors/domainErrors";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/inMemoryOrdersRepository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/inMemoryUsersRepository";
import type { IUploadService, IEmailQueueService } from "@/services/interfaces";
import { createUploadServiceMock } from "../utils";

vi.mock("@/services/shared/adminService", () => ({
	AdminService: {
		getAdminInfo: vi.fn().mockResolvedValue({
			id: "admin-123",
			email: "admin@example.com",
			name: "Admin User",
			role: "admin"
		})
	}
}));

const mockEmailQueueService: IEmailQueueService = {
	execute: vi.fn().mockResolvedValue({ jobId: "job-123", success: true }),
	sendWelcomeEmail: vi.fn().mockResolvedValue({ jobId: "welcome-job-123", success: true }),
	sendOrderConfirmation: vi.fn().mockResolvedValue({ jobId: "order-job-123", success: true }),
	sendPasswordReset: vi.fn().mockResolvedValue({ jobId: "reset-job-123", success: true }),
	sendAdminNotification: vi.fn().mockResolvedValue({ jobId: "admin-job-123", success: true }),
	sendOrderStatusUpdate: vi.fn().mockResolvedValue({ jobId: "status-job-123", success: true }),
	scheduleEmail: vi.fn().mockResolvedValue({ jobId: "schedule-job-123", success: true }),
	getQueueStats: vi.fn(),
	getPendingJobs: vi.fn(),
	getFailedJobs: vi.fn()
};

let ordersRepository: InMemoryOrdersRepository;
let usersRepository: InMemoryUsersRepository;
let uploadService: IUploadService;
let sut: EmitOrderService;

describe("EmitOrderService", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    usersRepository = new InMemoryUsersRepository();
    uploadService = createUploadServiceMock();
    sut = new EmitOrderService(ordersRepository, uploadService, mockEmailQueueService, usersRepository);

    vi.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should emit order when data is valid", async () => {
      await usersRepository.create({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hashed-password",
        role: "user"
      });

      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      };

      const { order } = await sut.execute(orderData);

      expect(order.id).toEqual(expect.any(String));
      expect(order.title).toBe("Test Order");
      expect(order.status).toBe("pending");
      expect(order.imageUrl).toBe("https://cloudinary.com/test-image.jpg");

      expect(uploadService.execute).toHaveBeenCalledWith({
        buffer: imageBuffer,
        userId: "user-123",
        folder: "orders",
      });
    });

    it("should send order confirmation email when order is created", async () => {
      await usersRepository.create({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hashed-password",
        role: "user"
      });

      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      };

      const { order } = await sut.execute(orderData);

      expect(mockEmailQueueService.execute).toHaveBeenCalledWith({
        to: "john@example.com",
        template: "order-confirmation",
        data: {
          orderId: order.id,
          title: "Test Order",
          description: "Test description",
          status: "pending",
          userId: "user-123",
          userName: "John Doe",
          imageUrl: "https://cloudinary.com/test-image.jpg"
        },
        priority: 1,
        delay: 0
      });
    });

    it("should send admin notification email when order is created", async () => {
      await usersRepository.create({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hashed-password",
        role: "user"
      });

      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      };

      const { order } = await sut.execute(orderData);

      expect(mockEmailQueueService.sendAdminNotification).toHaveBeenCalledWith(
        "admin@example.com",
        {
          subject: "Novo Pedido Criado",
          event: "order.created",
          details: {
            orderId: order.id,
            orderTitle: "Test Order",
            orderDescription: "Test description",
            userId: "user-123",
            userName: "John Doe",
            userEmail: "john@example.com",
            imageUrl: "https://cloudinary.com/test-image.jpg",
            createdAt: expect.any(Date)
          },
          timestamp: expect.any(String)
        }
      );
    });

    it("should allow emitting when user has no pending orders", async () => {
      await usersRepository.create({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        password_hash: "hashed-password",
        role: "user"
      });

      await ordersRepository.create({
        userId: "user-123",
        title: "Processed Order",
        description: "",
        imageUrl: "https://example.com/processed.jpg",
        status: "approved"
      });

      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "New Order",
        description: "New description",
        imageBuffer,
      };

      const { order } = await sut.execute(orderData);

      expect(order.title).toBe("New Order");
      expect(order.status).toBe("pending");
      expect(order.imageUrl).toBe("https://cloudinary.com/test-image.jpg");
    });
  });

  describe("Error Cases", () => {
    it("should throw OrderAlreadyExistsError when user already has a pending order", async () => {
      await ordersRepository.create({
        userId: "user-123",
        title: "Existing Order",
        description: "",
        imageUrl: "https://example.com/existing.jpg",
        status: "pending"
      });

      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "New Order",
        description: "New description",
        imageBuffer,
      };

      await expect(sut.execute(orderData)).rejects.toBeInstanceOf(OrderAlreadyExistsError);
      expect(uploadService.execute).not.toHaveBeenCalled();
    });

    it("should handle upload service errors", async () => {
      (uploadService.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Upload failed"));
      
      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      };

      await expect(sut.execute(orderData)).rejects.toThrow("Upload failed");
    });
  });
});