import { logger } from "@/lib/winston";
import { AuditService } from "@/services/logging/auditService";
import type { OrdersRepository } from "@/repositories/ordersRepository";
import type { UsersRepository } from "@/repositories/usersRepository";
import { OrderAlreadyExistsError } from "../errors/domainErrors";
import { AdminService } from "../shared/adminService";
import type { 
	IEmitOrderService, 
	EmitOrderServiceRequest, 
	EmitOrderServiceResponse,
	IUploadService,
	IEmailQueueService
} from "../interfaces";

export class EmitOrderService implements IEmitOrderService {
	constructor(
		private ordersRepository: OrdersRepository,
		private uploadService: IUploadService,
		private emailQueueService: IEmailQueueService,
		private usersRepository: UsersRepository,
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

		const user = await this.usersRepository.findById(userId);
		
		if (user) {
			try {
				await this.emailQueueService.execute({
					to: user.email,
					template: "order-confirmation",
					data: {
						orderId: order.id,
						title: order.title,
						description: order.description,
						status: order.status,
						userId: order.userId,
						userName: user.name,
						imageUrl: order.imageUrl
					},
					priority: 1,
					delay: 0
				});
				logger.info("Order confirmation email queued successfully", { 
					orderId: order.id, 
					userId, 
					userEmail: user.email 
				});
				
				const adminInfo = await AdminService.getAdminInfo();
				if (adminInfo) {
					await this.emailQueueService.sendAdminNotification(
						adminInfo.email,
						{
							subject: "Novo Pedido Criado",
							event: "order.created",
							details: {
								orderId: order.id,
								orderTitle: order.title,
								orderDescription: order.description,
								userId: order.userId,
								userName: user.name,
								userEmail: user.email,
								imageUrl: order.imageUrl,
								createdAt: order.createdAt
							},
							timestamp: new Date().toISOString()
						}
					);
					logger.info("Admin notification email queued successfully", { 
						orderId: order.id, 
						adminEmail: adminInfo.email 
					});
				}
			} catch (error) {
				logger.error("Failed to queue order confirmation email", { 
					orderId: order.id, 
					userId, 
					userEmail: user.email, 
					error: error instanceof Error ? error.message : 'Unknown error' 
				});
			}
		} else {
			logger.warn("User not found for order confirmation email", { 
				orderId: order.id, 
				userId 
			});
		}

		return { order };
	}
}
