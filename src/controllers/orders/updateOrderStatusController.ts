import { makeUpdateOrderStatusService } from "@/services/factories";
import { asyncHandler } from "@/middlewares";
import type { Request, Response } from "express";

export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { status, adminName, reason } = req.body;
    const { id: orderId } = req.params;

    const updateOrderStatusService = makeUpdateOrderStatusService();

    const result = await updateOrderStatusService.execute({
        orderId,
        status,
        adminName,
        reason,
    });

    return res.status(200).json({
        success: result.success,
        message: result.message,
        data: {
            orderId,
            status,
            updatedAt: new Date().toISOString(),
            processedBy: adminName || "system",
        }
    });
});
