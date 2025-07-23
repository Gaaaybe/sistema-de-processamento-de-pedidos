import { PrismaOrdersRepository, PrismaUsersRepository } from "@/repositories";
import { makeEmailQueueService } from "../";
import { UpdateOrderStatusService } from "@/services";
import type { IUpdateOrderStatusService } from "@/services/interfaces";

export function makeUpdateOrderStatusService(): IUpdateOrderStatusService {
    const ordersRepository = new PrismaOrdersRepository();
    const usersRepository = new PrismaUsersRepository();
    const emailQueueService = makeEmailQueueService();
    
    return new UpdateOrderStatusService(ordersRepository, usersRepository, emailQueueService);
}

