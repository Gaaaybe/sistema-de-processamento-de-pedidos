import type { Order, OrderStatus, Prisma } from "@prisma/client";

export interface OrdersRepository {
	findById(id: string): Promise<Order | null>;
	findAll(): Promise<Order[]>;
	create(data: Prisma.OrderUncheckedCreateInput): Promise<Order>;
	update(id: string, data: Prisma.OrderUpdateInput): Promise<Order>;
	delete(id: string): Promise<void>;
	findFirstByUserAndStatus(
		userId: string,
		status: OrderStatus,
	): Promise<Order | null>;
	findManyByUser(
		userId: string,
	): Promise<Order[]>;
}
