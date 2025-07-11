import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmitOrderService } from "../emitOrderService";
import { OrderAlreadyExistsError } from "../errors/domainErrors";
import { InMemoryOrdersRepository } from "../../repositories/in-memory/inMemoryOrdersRepository";

let ordersRepository: InMemoryOrdersRepository;
let sut: EmitOrderService;

describe("Emit Order Service", () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new EmitOrderService(ordersRepository);
  });

  it("should be able to emit an order", async () => {
    const { order } = await sut.execute({
      userId: "user-123",
      title: "Test Order",
      description: "Test description",
      imageUrl: "https://example.com/image.jpg",
      imagePublicId: "test-image-id"
    });

    expect(order.id).toEqual(expect.any(String));
    expect(order.title).toBe("Test Order");
    expect(order.status).toBe("pending");
    expect(order.imageUrl).toBe("https://example.com/image.jpg");
  });

  it("should not allow emitting when user already has a pending order", async () => {
    await ordersRepository.create({
      userId: "user-123",
      title: "Existing Order",
      description: "",
      imageUrl: "https://example.com/existing.jpg",
      status: "pending"
    });

    await expect(
      sut.execute({
        userId: "user-123",
        title: "New Order",
        description: "New description",
        imageUrl: "https://example.com/new.jpg"
      })
    ).rejects.toBeInstanceOf(OrderAlreadyExistsError);
  });

  it("should allow emitting when user has no pending orders", async () => {
    await ordersRepository.create({
      userId: "user-123",
      title: "Processed Order",
      description: "",
      imageUrl: "https://example.com/processed.jpg",
      status: "approved"
    });

    const { order } = await sut.execute({
      userId: "user-123",
      title: "New Order",
      description: "New description",
      imageUrl: "https://example.com/new.jpg"
    });

    expect(order.title).toBe("New Order");
    expect(order.status).toBe("pending");
  });
});