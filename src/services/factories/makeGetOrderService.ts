import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { GetOrderService } from "../getOrderService";

export function makeGetOrderService() {
    const ordersRepository = new PrismaOrdersRepository();
    const getOrderService = new GetOrderService(ordersRepository);
    return getOrderService;
}