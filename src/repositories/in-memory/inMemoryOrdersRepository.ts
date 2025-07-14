import { connect } from "node:http2";
import type { Order, OrderStatus, Prisma } from "@prisma/client";
import type { OrdersRepository } from "../ordersRepository";

export class InMemoryOrdersRepository implements OrdersRepository {
	public items: Order[] = [];

	async findById(id: string): Promise<Order | null> {
		const order = this.items.find((order) => order.id === id);
		return order || null;
	}

	async findAll(): Promise<Order[]> {
		return this.items;
	}
	async findFirstByUserAndStatus(
		userId: string,
		status: OrderStatus,
	): Promise<Order | null> {
		const order = this.items.find(
			(order) => order.userId === userId && order.status === status,
		);
		return order || null;
	}

	async findManyByUser(userId: string): Promise<Order[]> {
		const orders = this.items.filter((order) => order.userId === userId);
		return orders;
	}

	async create(data: Prisma.OrderUncheckedCreateInput): Promise<Order> {
		const order: Order = {
			id: data.id || crypto.randomUUID(),
			title: data.title,
			description: data.description || "",
			imageUrl: data.imageUrl,
			status: data.status || "pending",
			createdAt: new Date(),
			processedAt: data.processedAt ? new Date(data.processedAt) : null,
			userId: data.userId,
		};
		this.items.push(order);
		return order;
	}

	async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
		const orderIndex = this.items.findIndex((order) => order.id === id);

		const currentOrder = this.items[orderIndex];

		const updatedOrder: Order = {
			...currentOrder,
			title: data.title !== undefined ? String(data.title) : currentOrder.title,
			description:
				data.description !== undefined
					? String(data.description)
					: currentOrder.description,
			imageUrl:
				data.imageUrl !== undefined
					? String(data.imageUrl)
					: currentOrder.imageUrl,
			status:
				data.status !== undefined
					? (String(data.status) as any)
					: currentOrder.status,
			processedAt:
				data.processedAt !== undefined
					? data.processedAt
						? new Date(data.processedAt as any)
						: null
					: currentOrder.processedAt,
		};

		this.items[orderIndex] = updatedOrder;
		return updatedOrder;
	}

	async delete(id: string): Promise<void> {
		const orderIndex = this.items.findIndex((order) => order.id === id);
		if (orderIndex !== -1) {
			this.items.splice(orderIndex, 1);
		}
	}
}
