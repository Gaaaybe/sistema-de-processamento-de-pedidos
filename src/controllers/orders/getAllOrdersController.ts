import { makeGetAllOrdersService } from "@/services";
import { asyncHandler } from "@/middlewares";
import type { Request, Response } from "express";

export const getAllOrdersController = asyncHandler(
    async (req: Request, res: Response) => {
        const getAllOrdersService = makeGetAllOrdersService();

        const { orders } = await getAllOrdersService.execute();

        return res.status(200).json({
            message: "All orders retrieved successfully",
            orders: orders
        });
    }
);