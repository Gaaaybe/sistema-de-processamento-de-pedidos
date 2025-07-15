import { makeGetUserOrdersService } from "@/services";
import { asyncHandler } from "@/middlewares";
import type { Request, Response } from "express";

export const getUserOrdersController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = (req.user as NonNullable<typeof req.user>).id;

        const getUserOrdersService = makeGetUserOrdersService();

        const { orders } = await getUserOrdersService.execute({ userId });

        return res.status(200).json({
            message: "Orders retrieved successfully",
            orders: orders
        });
    }
);
