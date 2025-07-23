import type { OrdersRepository } from "@/repositories";
import { logger } from "@/lib/winston";
import type { IGetAllOrdersService, GetAllOrdersServiceResponse } from "../interfaces";

export class GetAllOrdersService implements IGetAllOrdersService {
    constructor(private ordersRepository: OrdersRepository) {}

    async execute(): Promise<GetAllOrdersServiceResponse> {
        logger.info("Fetching all orders");

        const orders = await this.ordersRepository.findAll();

        logger.info("All orders fetched successfully", {
            ordersCount: orders.length,
        });

        return {
            orders,
        };
    }
}

