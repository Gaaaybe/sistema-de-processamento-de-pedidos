import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { EmitOrderService } from "../emitOrderService";
import { makeUploadService } from "./makeUploadService";

export function makeEmitOrderService() {
    const ordersRepository = new PrismaOrdersRepository();
    const uploadService = makeUploadService();
    const emitOrderService = new EmitOrderService(ordersRepository, uploadService);
    return emitOrderService;
}