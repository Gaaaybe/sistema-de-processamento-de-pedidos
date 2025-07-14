import { InMemoryOrdersRepository } from "../../repositories/in-memory/inMemoryOrdersRepository";
import { GetOrderService } from "../getOrderService";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderNotFoundError } from "../errors/domainErrors";


let ordersRepository: InMemoryOrdersRepository;
let sut: GetOrderService;

describe("Get Order Service", () => {
    beforeEach(() => {
        ordersRepository = new InMemoryOrdersRepository();
        sut = new GetOrderService(ordersRepository);
        vi.clearAllMocks();
    });

    it("should be able to get an order by ID", async () => {
        const orderId = "order-123";
        await ordersRepository.create({
            id: orderId,
            userId: "user-123",
            title: "Test Order",
            description: "Test description",
            status: "pending",
            imageUrl: "https://example.com/image.jpg",
        });

        const { order } = await sut.execute({ orderId });

        expect(order).toBeDefined();
        expect(order.id).toBe(orderId);
        expect(order.title).toBe("Test Order");
    });

    it("should return OrderNotFoundError if order does not exist", async () => {
        const orderId = "non-existent-order";

        await expect(sut.execute({ orderId })).rejects.toThrow(OrderNotFoundError);
    });
});
