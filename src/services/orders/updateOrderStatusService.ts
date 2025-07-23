import { logger } from "@/lib/winston";
import { AuditService } from "@/services/logging/auditService";
import type { OrdersRepository, UsersRepository } from "@/repositories";
import { OrderNotFoundError } from "../errors/domainErrors";
import type { 
    IUpdateOrderStatusService, 
    UpdateOrderStatusServiceRequest, 
    UpdateOrderStatusServiceResponse,
    IEmailQueueService
} from "../interfaces";

export class UpdateOrderStatusService implements IUpdateOrderStatusService {
    constructor(
        private ordersRepository: OrdersRepository,
        private usersRepository: UsersRepository,
        private emailQueueService: IEmailQueueService
    ) {}
    
    async execute({
        orderId,
        status,
        adminName,
        reason,
    }: UpdateOrderStatusServiceRequest): Promise<UpdateOrderStatusServiceResponse> {
        logger.info("Starting order status update", { orderId, status, adminName });

        const order = await this.ordersRepository.findById(orderId);

        if (!order) {
            logger.warn("Order not found", { orderId });
            throw new OrderNotFoundError("Order not found");
        }

        if (order.status !== "pending") {
            logger.warn("Order is not pending for status update", { orderId, currentStatus: order.status });
            throw new OrderNotFoundError("Order is not pending and cannot be updated");
        }

        const user = await this.usersRepository.findById(order.userId);
        if (!user) {
            logger.error("User not found for order", { orderId, userId: order.userId });
            throw new OrderNotFoundError("User not found for order");
        }

        const updateData = {
            ...order,
            status,
            processedAt: new Date(),
        };

        const updatedOrder = await this.ordersRepository.update(orderId, updateData);

        logger.info("Order status updated successfully", {
            orderId: updatedOrder.id,
            newStatus: updatedOrder.status,
            processedBy: adminName,
        });

        AuditService.orderStatusChanged(orderId, status);

        try {
            await this.emailQueueService.sendOrderStatusUpdate(user.email, {
                userName: user.name,
                orderId: updatedOrder.id,
                title: updatedOrder.title,
                status: updatedOrder.status,
                userId: user.id,
                imageUrl: updatedOrder.imageUrl,
                adminName,
                reason,
                updatedAt: updatedOrder.processedAt?.toLocaleString('pt-BR') || new Date().toLocaleString('pt-BR'),
            });

            logger.info("Order status update email queued successfully", {
                orderId: updatedOrder.id,
                userEmail: user.email,
                status: updatedOrder.status,
            });
        } catch (emailError) {
            logger.error("Failed to queue order status update email", {
                orderId: updatedOrder.id,
                userEmail: user.email,
                error: emailError instanceof Error ? emailError.message : 'Unknown error',
            });
        }

        return {
            success: true,
            message: `Order status updated to ${status} successfully`,
        };
    }
}