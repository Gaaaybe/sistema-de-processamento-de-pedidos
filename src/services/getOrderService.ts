import type { Order } from "@prisma/client";
import type { OrdersRepository } from "../repositories/ordersRepository";
import { logger } from "@/lib/winston";
import { OrderNotFoundError } from "./errors/domainErrors";

interface GetOrderServiceRequest {
    orderId: string;
}

interface GetOrderServiceResponse {
    order: Order;
}

export class GetOrderService {
    constructor(private ordersRepository: OrdersRepository) {}

    async execute({ orderId }: GetOrderServiceRequest): Promise<GetOrderServiceResponse> {
        logger.info("Fetching order by ID", { orderId });

        const order = await this.ordersRepository.findById(orderId);
        if (!order) {
            logger.warn("Order not found", { orderId });
            throw new OrderNotFoundError(`Order with ID ${orderId} not found`);
        }
        logger.info("Order fetched successfully", { orderId, order });
        return { order };
    }
}