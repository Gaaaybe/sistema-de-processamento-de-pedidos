import { PrismaOrdersRepository, PrismaUsersRepository } from "@/repositories";
import { EmitOrderService } from "@/services";
import { makeUploadService, makeEmailQueueService } from "../";
import type { IEmitOrderService } from "@/services/interfaces";

export function makeEmitOrderService(): IEmitOrderService {
    const ordersRepository = new PrismaOrdersRepository();
    const usersRepository = new PrismaUsersRepository();
    const uploadService = makeUploadService();
    const emailQueueService = makeEmailQueueService();
    const emitOrderService = new EmitOrderService(ordersRepository, uploadService, emailQueueService, usersRepository);
    return emitOrderService;
}