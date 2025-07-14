import { prisma } from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";
import type { OrdersRepository } from "../ordersRepository";

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

	async findManyByUser(userId: string) {
		const orders = await prisma.order.findMany({
			where: { userId },
		});
		return orders;
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
