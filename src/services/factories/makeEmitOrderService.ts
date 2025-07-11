import { PrismaOrdersRepository } from "@/repositories/prisma/prismaOrdersRepository";
import { EmitOrderService } from "../emitOrderService";

export function makeEmitOrderService() {
    const ordersRepository = new PrismaOrdersRepository();
    const emitOrderService = new EmitOrderService(ordersRepository);
    return emitOrderService;
}