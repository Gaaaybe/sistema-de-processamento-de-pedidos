import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllOrdersService } from "@/services/orders/getAllOrdersService";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/inMemoryOrdersRepository";

let ordersRepository: InMemoryOrdersRepository;
let sut: GetAllOrdersService;

describe("GetAllOrdersService", () => {
    beforeEach(() => {
        ordersRepository = new InMemoryOrdersRepository();
        sut = new GetAllOrdersService(ordersRepository);
        vi.clearAllMocks();
    });

    describe("Happy Path", () => {
        it("should return all orders when orders exist", async () => {
            await ordersRepository.create({
                userId: "user-123",
                title: "Order 1",
                description: "Description 1",
                status: "pending",
                imageUrl: "https://example.com/image1.jpg",
            });
            await ordersRepository.create({
                userId: "user-456",
                title: "Order 2",
                description: "Description 2",
                status: "approved",
                imageUrl: "https://example.com/image2.jpg",
            });
            await ordersRepository.create({
                userId: "user-789",
                title: "Order 3",
                description: "Description 3",
                status: "rejected",
                imageUrl: "https://example.com/image3.jpg",
            });

            const { orders } = await sut.execute();

            expect(orders).toHaveLength(3);
            expect(orders[0].title).toBe("Order 1");
            expect(orders[0].userId).toBe("user-123");
            expect(orders[0].status).toBe("pending");
            expect(orders[1].title).toBe("Order 2");
            expect(orders[1].userId).toBe("user-456");
            expect(orders[1].status).toBe("approved");
            expect(orders[2].title).toBe("Order 3");
            expect(orders[2].userId).toBe("user-789");
            expect(orders[2].status).toBe("rejected");
        });

        it("should return orders with all required properties", async () => {
            await ordersRepository.create({
                userId: "user-complete",
                title: "Complete Order",
                description: "Complete description",
                status: "processing",
                imageUrl: "https://example.com/complete.jpg",
            });

            const { orders } = await sut.execute();

            expect(orders).toHaveLength(1);
            expect(orders[0]).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    userId: "user-complete",
                    title: "Complete Order",
                    description: "Complete description",
                    status: "processing",
                    imageUrl: "https://example.com/complete.jpg",
                    createdAt: expect.any(Date),
                })
            );
        });

        it("should return empty array when no orders exist", async () => {
            const { orders } = await sut.execute();

            expect(orders).toHaveLength(0);
            expect(orders).toEqual([]);
        });

        it("should return orders from different users", async () => {
            await ordersRepository.create({
                userId: "user-1",
                title: "Order from User 1",
                description: "Description 1",
                status: "pending",
                imageUrl: "https://example.com/user1.jpg",
            });
            await ordersRepository.create({
                userId: "user-2",
                title: "Order from User 2",
                description: "Description 2",
                status: "approved",
                imageUrl: "https://example.com/user2.jpg",
            });

            const { orders } = await sut.execute();

            expect(orders).toHaveLength(2);
            expect(orders.map(order => order.userId)).toEqual(
                expect.arrayContaining(["user-1", "user-2"])
            );
        });

        it("should return orders with different statuses", async () => {
            const statuses = ["pending", "approved", "rejected", "processing"] as const;
            
            for (const [index, status] of statuses.entries()) {
                await ordersRepository.create({
                    userId: `user-${index}`,
                    title: `Order ${index + 1}`,
                    description: `Description ${index + 1}`,
                    status,
                    imageUrl: `https://example.com/image${index + 1}.jpg`,
                });
            }

            const { orders } = await sut.execute();

            expect(orders).toHaveLength(4);
            const orderStatuses = orders.map(order => order.status);
            expect(orderStatuses).toEqual(
                expect.arrayContaining(["pending", "approved", "rejected", "processing"])
            );
        });
    });
});
