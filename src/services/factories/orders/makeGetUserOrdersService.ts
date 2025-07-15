import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { GetUserOrdersService } from "@/services/orders/getUserOrdersService";
import type { IGetUserOrdersService } from "@/services/interfaces";

export function makeGetUserOrdersService(): IGetUserOrdersService {
    const ordersRepository = new PrismaOrdersRepository();
    const getUserOrdersService = new GetUserOrdersService(ordersRepository);
    return getUserOrdersService;
}