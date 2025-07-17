import { makeEmitOrderService } from "@/services";
import { asyncHandler } from "@/middlewares";
import type { Request, Response } from "express";
import { ValidationError } from "@/services/errors/domainErrors";

export const emitOrderController = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const userId = (req.user as NonNullable<typeof req.user>).id;

  const emitOrderService = makeEmitOrderService();

  const { order } = await emitOrderService.execute({
    userId,
    title,
    description,
    imageBuffer: (req.file as NonNullable<typeof req.file>).buffer,
  });

  return res.status(201).json({
    message: "Order submitted successfully and is being processed",
    order: {
      id: order.id,
      title: order.title,
      userId: order.userId,
      status: order.status,
    },
  });
});