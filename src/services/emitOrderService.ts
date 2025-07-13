import { logger } from "@/lib/winston";
import { AuditService } from "@/services/logging/auditService";
import type { Order } from "@prisma/client";
import type { OrdersRepository } from "../repositories/ordersRepository";
import { OrderAlreadyExistsError } from "./errors/domainErrors";
import type { UploadService } from "./uploadService";

interface EmitOrderServiceRequest {
	userId: string;
	title: string;
	description?: string;
	imageBuffer: Buffer;
}

interface EmitOrderServiceResponse {
	order: Order;
}

export class EmitOrderService {
	constructor(
		private ordersRepository: OrdersRepository,
		private uploadService: UploadService,
	) {}

	async execute({
		userId,
		title,
		description = "",
		imageBuffer,
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

		const uploadResult = await this.uploadService.execute({
			buffer: imageBuffer,
			userId,
			folder: "orders",
		});

		const order = await this.ordersRepository.create({
			title,
			description,
			imageUrl: uploadResult.imageUrl,
			userId,
			status: "pending",
		});

		logger.info("Order emitted successfully", {
			orderId: order.id,
			userId,
			title,
			imageUrl: uploadResult.imageUrl,
		});

		AuditService.orderCreated(order.id, order.userId, {
			title: order.title,
			description: order.description,
			imagePublicId: uploadResult.imagePublicId,
		});

		return { order };
	}
}
