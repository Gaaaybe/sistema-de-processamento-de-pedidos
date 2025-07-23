import { PrismaOrdersRepository } from "@/repositories";
import { GetAllOrdersService } from "@/services/orders/getAllOrdersService";
import type { IGetAllOrdersService } from "@/services/interfaces";

export function makeGetAllOrdersService(): IGetAllOrdersService {
    const ordersRepository = new PrismaOrdersRepository();
    const getAllOrdersService = new GetAllOrdersService(ordersRepository);
    return getAllOrdersService;
}