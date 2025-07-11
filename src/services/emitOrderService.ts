import { logger } from "@/lib/winston";
import { AuditService } from "@/services/logging/auditService";
import type { Order } from "@prisma/client";
import type { OrdersRepository } from "../repositories/ordersRepository";
import { OrderAlreadyExistsError } from "./errors/domainErrors";

interface EmitOrderServiceRequest {
	userId: string;
	title: string;
	description?: string;
	imageUrl: string;
	imagePublicId?: string;
}

interface EmitOrderServiceResponse {
	order: Order;
}

export class EmitOrderService {
	constructor(private ordersRepository: OrdersRepository) {}

	async execute({
		userId,
		title,
		description = "",
		imageUrl,
		imagePublicId,
	}: EmitOrderServiceRequest): Promise<EmitOrderServiceResponse> {

		logger.info("Starting order emission", { userId, title });
		const existingOrder = await this.ordersRepository.findFirstByUserAndStatus(
			userId,
			"pending",
		);
		if (existingOrder) {
			logger.warn("Order emission failed: user already has a pending order", {
				userId,
				title,
			});
			throw new OrderAlreadyExistsError("User already has a pending order");
		}
		const order = await this.ordersRepository.create({
			title,
			description,
			imageUrl,
			userId,
			status: "pending",
		});
		logger.info("Order emitted successfully", {
			orderId: order.id,
			userId,
			title,
			imageUrl: `${imageUrl.substring(0, 50)} ...`, 
		});
        AuditService.orderCreated(order.id, order.userId, {
            title: order.title,
            description: order.description,
            imagePublicId
        });

		return { order };
	}
}
