import { makeEmitOrderService } from "@/services/factories/makeEmitOrderService";
import { asyncHandler } from "@/middlewares/errorHandler";
import type { Request, Response } from "express";

export const emitOrderController = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, imageUrl, imagePublicId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const emitOrderService = makeEmitOrderService();

  const { order } = await emitOrderService.execute({
    userId,
    title,
    description,
    imageUrl,
    imagePublicId
  });

  return res.status(201).json({
    message: "Order created successfully",
    order: order.title
  });
});