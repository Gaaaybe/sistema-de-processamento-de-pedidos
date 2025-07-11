import type { Prisma, OrderStatus } from "@prisma/client";
import type { OrdersRepository } from "../ordersRepository";
import { prisma } from "@/lib/prisma";

export class PrismaOrdersRepository implements OrdersRepository {
    async findById(id: string) {
        const order = await prisma.order.findUnique({
            where: { id },
        });
        return order;
    }

    async findAll() {
        const orders = await prisma.order.findMany();
        return orders;
    }

    async findFirstByUserAndStatus(userId: string, status: OrderStatus) {
        const order = await prisma.order.findFirst({
            where: {
                userId,
                status,
            },
        });
        return order;
    }

    async create(data: Prisma.OrderUncheckedCreateInput) {
        const order = await prisma.order.create({
            data,
        });
        return order;
    }

    async update(id: string, data: Prisma.OrderUpdateInput) {
        const order = await prisma.order.update({
            where: { id },
            data,
        });
        return order;
    }

    async delete(id: string) {
        await prisma.order.delete({
            where: { id },
        });
    }
}