import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { EmitOrderService } from "@/services/orders/emitOrderService";
import { makeUploadService } from "../shared/makeUploadService";
import { makeEmailQueueService } from "../shared/makeEmailQueueService";
import type { IEmitOrderService } from "@/services/interfaces";

export function makeEmitOrderService(): IEmitOrderService {
    const ordersRepository = new PrismaOrdersRepository();
    const usersRepository = new PrismaUsersRepository();
    const uploadService = makeUploadService();
    const emailQueueService = makeEmailQueueService();
    const emitOrderService = new EmitOrderService(ordersRepository, uploadService, emailQueueService, usersRepository);
    return emitOrderService;
}