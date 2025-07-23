import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateOrderStatusService } from "@/services/orders/updateOrderStatusService";
import { InMemoryOrdersRepository } from "@/repositories/in-memory/inMemoryOrdersRepository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/inMemoryUsersRepository";
import { OrderNotFoundError } from "@/services/errors/domainErrors";
import type { IEmailQueueService } from "@/services/interfaces";

vi.mock("@/lib/winston", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/services/logging/auditService", () => ({
    AuditService: {
        orderStatusChanged: vi.fn(),
    },
}));

const mockEmailQueueService: IEmailQueueService = {
    execute: vi.fn(),
    sendWelcomeEmail: vi.fn(),
    sendOrderConfirmation: vi.fn(),
    sendPasswordReset: vi.fn(),
    sendAdminNotification: vi.fn(),
    sendOrderStatusUpdate: vi.fn(),
    scheduleEmail: vi.fn(),
    getQueueStats: vi.fn(),
    getPendingJobs: vi.fn(),
    getFailedJobs: vi.fn(),
};

let ordersRepository: InMemoryOrdersRepository;
let usersRepository: InMemoryUsersRepository;
let emailQueueService: IEmailQueueService;
let sut: UpdateOrderStatusService;

describe("UpdateOrderStatusService", () => {
    beforeEach(() => {
        ordersRepository = new InMemoryOrdersRepository();
        usersRepository = new InMemoryUsersRepository();
        emailQueueService = mockEmailQueueService;
        sut = new UpdateOrderStatusService(ordersRepository, usersRepository, emailQueueService);
        vi.clearAllMocks();
    });

    describe("Happy Path", () => {
        it("should update order status from pending to approved successfully", async () => {
            const user = await usersRepository.create({
                name: "John Doe",
                email: "john@example.com",
                password_hash: "hashedpassword",
                role: "user",
            });

            const order = await ordersRepository.create({
                userId: user.id,
                title: "Test Order",
                description: "Test Description",
                status: "pending",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "approved" as const,
                adminName: "Admin User",
                reason: "Order meets all requirements",
            };

            const result = await sut.execute(request);

            expect(result.success).toBe(true);
            expect(result.message).toBe("Order status updated to approved successfully");

            const updatedOrder = await ordersRepository.findById(order.id);
            expect(updatedOrder?.status).toBe("approved");
            expect(updatedOrder?.processedAt).toBeDefined();

            expect(emailQueueService.sendOrderStatusUpdate).toHaveBeenCalledWith(
                user.email,
                expect.objectContaining({
                    userName: user.name,
                    orderId: order.id,
                    title: order.title,
                    status: "approved",
                    userId: user.id,
                    imageUrl: order.imageUrl,
                    adminName: "Admin User",
                    reason: "Order meets all requirements",
                })
            );
        });

        it("should update order status from pending to rejected successfully", async () => {
            const user = await usersRepository.create({
                name: "Jane Doe",
                email: "jane@example.com",
                password_hash: "hashedpassword",
                role: "user",
            });

            const order = await ordersRepository.create({
                userId: user.id,
                title: "Test Order",
                description: "Test Description",
                status: "pending",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "rejected" as const,
                adminName: "Admin User",
                reason: "Missing required documentation",
            };

            const result = await sut.execute(request);

            expect(result.success).toBe(true);
            expect(result.message).toBe("Order status updated to rejected successfully");

            const updatedOrder = await ordersRepository.findById(order.id);
            expect(updatedOrder?.status).toBe("rejected");
            expect(updatedOrder?.processedAt).toBeDefined();
        });

        it("should handle email queue service failure gracefully", async () => {
            const user = await usersRepository.create({
                name: "John Doe",
                email: "john@example.com",
                password_hash: "hashedpassword",
                role: "user",
            });

            const order = await ordersRepository.create({
                userId: user.id,
                title: "Test Order",
                description: "Test Description",
                status: "pending",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "approved" as const,
                adminName: "Admin User",
                reason: "Order approved",
            };

            vi.mocked(emailQueueService.sendOrderStatusUpdate).mockRejectedValue(
                new Error("Email service unavailable")
            );

            const result = await sut.execute(request);

            expect(result.success).toBe(true);
            expect(result.message).toBe("Order status updated to approved successfully");

            const updatedOrder = await ordersRepository.findById(order.id);
            expect(updatedOrder?.status).toBe("approved");
        });
    });

    describe("Error Cases", () => {
        it("should throw OrderNotFoundError when order does not exist", async () => {
            const request = {
                orderId: "non-existent-id",
                status: "approved" as const,
                adminName: "Admin User",
            };

            await expect(sut.execute(request)).rejects.toThrow(OrderNotFoundError);
            await expect(sut.execute(request)).rejects.toThrow("Order not found");
        });

        it("should throw OrderNotFoundError when order is not pending", async () => {
            const user = await usersRepository.create({
                name: "John Doe",
                email: "john@example.com",
                password_hash: "hashedpassword",
                role: "user",
            });

            const order = await ordersRepository.create({
                userId: user.id,
                title: "Test Order",
                description: "Test Description",
                status: "approved",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "rejected" as const,
                adminName: "Admin User",
            };

            await expect(sut.execute(request)).rejects.toThrow(OrderNotFoundError);
            await expect(sut.execute(request)).rejects.toThrow("Order is not pending and cannot be updated");
        });

        it("should throw OrderNotFoundError when user does not exist", async () => {
            const order = await ordersRepository.create({
                userId: "non-existent-user-id",
                title: "Test Order",
                description: "Test Description",
                status: "pending",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "approved" as const,
                adminName: "Admin User",
            };

            await expect(sut.execute(request)).rejects.toThrow(OrderNotFoundError);
            await expect(sut.execute(request)).rejects.toThrow("User not found for order");
        });
    });

    describe("Edge Cases", () => {
        it("should work without optional adminName and reason parameters", async () => {
            const user = await usersRepository.create({
                name: "John Doe",
                email: "john@example.com",
                password_hash: "hashedpassword",
                role: "user",
            });

            const order = await ordersRepository.create({
                userId: user.id,
                title: "Test Order",
                description: "Test Description",
                status: "pending",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "approved" as const,
            };

            const result = await sut.execute(request);

            expect(result.success).toBe(true);
            expect(result.message).toBe("Order status updated to approved successfully");

            expect(emailQueueService.sendOrderStatusUpdate).toHaveBeenCalledWith(
                user.email,
                expect.objectContaining({
                    userName: user.name,
                    orderId: order.id,
                    title: order.title,
                    status: "approved",
                    adminName: undefined,
                    reason: undefined,
                })
            );
        });

        it("should update order to processing status", async () => {
            const user = await usersRepository.create({
                name: "John Doe",
                email: "john@example.com",
                password_hash: "hashedpassword",
                role: "user",
            });

            const order = await ordersRepository.create({
                userId: user.id,
                title: "Test Order",
                description: "Test Description",
                status: "pending",
                imageUrl: "https://example.com/image.jpg",
            });

            const request = {
                orderId: order.id,
                status: "processing" as const,
                adminName: "Admin User",
                reason: "Order started processing",
            };

            const result = await sut.execute(request);

            expect(result.success).toBe(true);
            expect(result.message).toBe("Order status updated to processing successfully");

            const updatedOrder = await ordersRepository.findById(order.id);
            expect(updatedOrder?.status).toBe("processing");
        });
    });
});
