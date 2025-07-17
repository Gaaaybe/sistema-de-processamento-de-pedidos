import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetUserOrdersService } from "@/services/orders/getUserOrdersService";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/inMemoryOrdersRepository";

let ordersRepository: InMemoryOrdersRepository;
let sut: GetUserOrdersService;

describe("GetUserOrdersService", () => {
    beforeEach(() => {
        ordersRepository = new InMemoryOrdersRepository();
        sut = new GetUserOrdersService(ordersRepository);
        vi.clearAllMocks();
    });

    describe("Happy Path", () => {
        it("should get user orders when user has orders", async () => {
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
            expect(orders[0].userId).toBe(userId);
            expect(orders[1].userId).toBe(userId);
        });

        it("should return empty array when user has no orders", async () => {
            const userId = "user-456";

            const { orders } = await sut.execute({ userId });

            expect(orders).toHaveLength(0);
            expect(orders).toEqual([]);
        });
    });

    describe("Error Cases", () => {
        it("should handle repository errors gracefully", async () => {
            const userId = "user-123";
            vi.spyOn(ordersRepository, 'findManyByUser').mockRejectedValue(new Error("Database error"));

            await expect(sut.execute({ userId })).rejects.toThrow("Database error");
        });
    });
});
