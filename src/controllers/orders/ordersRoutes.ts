import { Router } from "express";
import { 
  getAllOrdersController, 
  getUserOrdersController, 
  emitOrderController,
  updateOrderStatusController 
} from "@/controllers/orders/";
import { 
  validateJWT, 
  validateEmitOrder, 
  validateUpdateOrderStatus,
  uploadSingle, 
  validateImageFile 
} from "@/middlewares";

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

orderRouter.get(
  "/admin/orders",
  validateJWT("admin"),
  getAllOrdersController
);

orderRouter.patch(
  "/admin/orders/:id/status",
  validateJWT("admin"),
  validateUpdateOrderStatus,
  updateOrderStatusController
);

export default orderRouter;