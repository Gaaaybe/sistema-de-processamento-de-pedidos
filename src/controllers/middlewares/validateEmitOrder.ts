import { emitOrderRequestSchema } from "@/schemas/orderSquemas";
import type { Request, Response, NextFunction } from "express";

export const validateEmitOrder = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = emitOrderRequestSchema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  next();
};