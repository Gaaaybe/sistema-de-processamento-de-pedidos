import { makeGetOrderService } from "@/services/factories/makeGetOrderService";
import { asyncHandler } from "@/middlewares/errorHandler";
import type { Request, Response } from "express";


export const getOrderController = asyncHandler(async (req: Request, res: Response) => {
  const orderId = req.params.id;

  const getOrderService = makeGetOrderService();

  const { order } = await getOrderService.execute({ orderId });

  return res.status(200).json({
    message: "Order retrieved successfully",
    order: order
  });
});