import { GetUserOrdersService } from "../getUserOrdersService";
import { InMemoryOrdersRepository } from "../../repositories/in-memory/inMemoryOrdersRepository";
import { describe, it, expect, vi, beforeEach } from "vitest";


let ordersRepository: InMemoryOrdersRepository;
let sut: GetUserOrdersService;

describe("Get User Orders Service", () => {
    beforeEach(() => {
        ordersRepository = new InMemoryOrdersRepository();
        sut = new GetUserOrdersService(ordersRepository);
        vi.clearAllMocks();
    });

    it("should be able to get user orders", async () => {
        const userId = "user-123";
        await ordersRepository.create({
            userId,
            title: "Order 1",
            description: "Description 1",
            status: "pending",
            imageUrl: "https://example.com/image1.jpg",
        });
        await ordersRepository.create({
            userId,
            title: "Order 2",
            description: "Description 2",
            status: "pending",
            imageUrl: "https://example.com/image2.jpg",
        });

        const { orders } = await sut.execute({ userId });

        expect(orders).toHaveLength(2);
        expect(orders[0].title).toBe("Order 1");
        expect(orders[1].title).toBe("Order 2");
    });

    it("should return an empty array if user has no orders", async () => {
        const { orders } = await sut.execute({ userId: "user-456" });
        expect(orders).toHaveLength(0);
    });
});
