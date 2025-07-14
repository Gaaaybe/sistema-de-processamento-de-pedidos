import { getOrderRequestSchema } from "@/schemas/orderSquemas";
import type { Request, Response, NextFunction } from "express";

export const validateGetOrder = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = getOrderRequestSchema.safeParse(req.params);
  if (!result.success) {
    return next(result.error);
  }
  next();
};