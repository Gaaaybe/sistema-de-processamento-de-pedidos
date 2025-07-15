import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { EmitOrderService } from "@/services/orders/emitOrderService";
import { makeUploadService } from "../shared/makeUploadService";
import type { IEmitOrderService } from "@/services/interfaces";

export function makeEmitOrderService(): IEmitOrderService {
    const ordersRepository = new PrismaOrdersRepository();
    const uploadService = makeUploadService();
    const emitOrderService = new EmitOrderService(ordersRepository, uploadService);
    return emitOrderService;
}