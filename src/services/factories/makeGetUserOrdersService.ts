import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { GetUserOrdersService } from "../getUserOrdersService";

export function makeGetUserOrdersService() {
    const ordersRepository = new PrismaOrdersRepository();
    const getUserOrdersService = new GetUserOrdersService(ordersRepository);
    return getUserOrdersService;
}