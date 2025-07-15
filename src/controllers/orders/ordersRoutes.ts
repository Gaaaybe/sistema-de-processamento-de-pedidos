import { Router } from "express";
import { emitOrderController } from "./emitOrderController";
import { getUserOrdersController } from "./getUserOrdersController";
import { validateJWT, validateEmitOrder, uploadSingle, validateImageFile } from "@/middlewares";

const orderRouter = Router();

orderRouter.get(
  "/orders",
    validateJWT("user"),
    getUserOrdersController
);

orderRouter.post(
  "/orders",
  validateJWT("user"),
  uploadSingle,
  validateImageFile,
  validateEmitOrder, 
  emitOrderController
);

export default orderRouter;