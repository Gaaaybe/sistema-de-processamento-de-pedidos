import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmitOrderService } from "@/services/orders/emitOrderService";
import { OrderAlreadyExistsError } from "@/services/errors/domainErrors";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/inMemoryOrdersRepository";
import type { IUploadService } from "@/services/interfaces";
import { createUploadServiceMock } from "../utils";

let ordersRepository: InMemoryOrdersRepository;
let uploadService: IUploadService;
let sut: EmitOrderService;

describe("EmitOrderService", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    uploadService = createUploadServiceMock();
    sut = new EmitOrderService(ordersRepository, uploadService);

    vi.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should emit order when data is valid", async () => {
      // Arrange
      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      };

      // Act
      const { order } = await sut.execute(orderData);

      // Assert
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

    it("should allow emitting when user has no pending orders", async () => {
      // Arrange
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

      // Act
      const { order } = await sut.execute(orderData);

      // Assert
      expect(order.title).toBe("New Order");
      expect(order.status).toBe("pending");
      expect(order.imageUrl).toBe("https://cloudinary.com/test-image.jpg");
    });
  });

  describe("Error Cases", () => {
    it("should throw OrderAlreadyExistsError when user already has a pending order", async () => {
      // Arrange
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

      // Act & Assert
      await expect(sut.execute(orderData)).rejects.toBeInstanceOf(OrderAlreadyExistsError);
      expect(uploadService.execute).not.toHaveBeenCalled();
    });

    it("should handle upload service errors", async () => {
      // Arrange
      (uploadService.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Upload failed"));
      
      const imageBuffer = Buffer.from("fake-image-data");
      const orderData = {
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      };

      // Act & Assert
      await expect(sut.execute(orderData)).rejects.toThrow("Upload failed");
    });
  });
});