import type { Order } from "@prisma/client";
import type { OrdersRepository } from "../repositories/ordersRepository";
import { logger } from "@/lib/winston";


interface GetUserOrdersServiceRequest {
    userId: string;
}

interface GetUserOrdersServiceResponse {
  orders: Order[];
}

export class GetUserOrdersService {
    constructor(private ordersRepository: OrdersRepository) {}
    async execute({
        userId,
    }: GetUserOrdersServiceRequest): Promise<GetUserOrdersServiceResponse> {
        logger.info("Fetching user orders", { userId });

        const orders = await this.ordersRepository.findManyByUser(userId);

        logger.info("User orders fetched successfully", {
            userId,
            ordersCount: orders.length,
        });

        return {
            orders,
        };
    }
}