import { Router } from "express";
import { emitOrderController } from "./emitOrderController";
import { getUserOrdersController } from "./getUserOrdersController";
import { validateJWT } from "../middlewares/validateJWT";
import { validateEmitOrder } from "../middlewares/validateEmitOrder";
import { uploadSingle, validateImageFile } from "@/controllers/middlewares/uploadMiddleware";

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