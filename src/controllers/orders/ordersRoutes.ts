import { Router } from "express";
import { emitOrderController } from "./emitOrderController";
import { validateJWT } from "../middlewares/validateJWT";
import { validateEmitOrder } from "../middlewares/validateEmitOrder";
import { upload, handleImageUpload } from "@/controllers/middlewares/uploadMiddleware";

const orderRouter = Router();

orderRouter.post(
  "/orders",
  validateJWT("user"), // Usuários autenticados podem criar pedidos
  upload.single('image'), // Espera um campo 'image' no form-data
  handleImageUpload, // Faz upload para Cloudinary
  validateEmitOrder, // Valida os dados do pedido
  emitOrderController
);

export default orderRouter;