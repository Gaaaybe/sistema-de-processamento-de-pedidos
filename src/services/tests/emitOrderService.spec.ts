import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmitOrderService } from "../emitOrderService";
import { OrderAlreadyExistsError } from "../errors/domainErrors";
import { InMemoryOrdersRepository } from "../../repositories/in-memory/inMemoryOrdersRepository";
import type { UploadService } from "../uploadService";

let ordersRepository: InMemoryOrdersRepository;
let uploadService: UploadService;
let sut: EmitOrderService;

const mockUploadService = {
  execute: vi.fn(),
  deleteImage: vi.fn(),
} as unknown as UploadService;

describe("Emit Order Service", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    uploadService = mockUploadService;
    sut = new EmitOrderService(ordersRepository, uploadService);

    vi.clearAllMocks();

    (mockUploadService.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      imageUrl: "https://cloudinary.com/test-image.jpg",
      imagePublicId: "test-public-id",
      metadata: {
        width: 800,
        height: 600,
        format: "jpg",
        bytes: 123456,
      },
    });
  });

  it("should be able to emit an order", async () => {
    const imageBuffer = Buffer.from("fake-image-data");
    
    const { order } = await sut.execute({
      userId: "user-123",
      title: "Test Order",
      description: "Test description",
      imageBuffer,
    });

    expect(order.id).toEqual(expect.any(String));
    expect(order.title).toBe("Test Order");
    expect(order.status).toBe("pending");
    expect(order.imageUrl).toBe("https://cloudinary.com/test-image.jpg");

    expect(mockUploadService.execute).toHaveBeenCalledWith({
      buffer: imageBuffer,
      userId: "user-123",
      folder: "orders",
    });
  });

  it("should not allow emitting when user already has a pending order", async () => {
    await ordersRepository.create({
      userId: "user-123",
      title: "Existing Order",
      description: "",
      imageUrl: "https://example.com/existing.jpg",
      status: "pending"
    });

    const imageBuffer = Buffer.from("fake-image-data");

    await expect(
      sut.execute({
        userId: "user-123",
        title: "New Order",
        description: "New description",
        imageBuffer,
      })
    ).rejects.toBeInstanceOf(OrderAlreadyExistsError);

    expect(mockUploadService.execute).not.toHaveBeenCalled();
  });

  it("should allow emitting when user has no pending orders", async () => {
    await ordersRepository.create({
      userId: "user-123",
      title: "Processed Order",
      description: "",
      imageUrl: "https://example.com/processed.jpg",
      status: "approved"
    });

    const imageBuffer = Buffer.from("fake-image-data");

    const { order } = await sut.execute({
      userId: "user-123",
      title: "New Order",
      description: "New description",
      imageBuffer,
    });

    expect(order.title).toBe("New Order");
    expect(order.status).toBe("pending");
    expect(order.imageUrl).toBe("https://cloudinary.com/test-image.jpg");
  });
  
  it("should handle upload service errors", async () => {
    (mockUploadService.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Upload failed"));
    
    const imageBuffer = Buffer.from("fake-image-data");

    await expect(
      sut.execute({
        userId: "user-123",
        title: "Test Order",
        description: "Test description",
        imageBuffer,
      })
    ).rejects.toThrow("Upload failed");
  });
});