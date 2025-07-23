import { updateOrderStatusRequestSchema } from "@/schemas/orderSchemas";
import type { Request, Response, NextFunction } from "express";

export const validateUpdateOrderStatus = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = updateOrderStatusRequestSchema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  next();
};
