import { asyncHandler } from "@/middlewares/errorHandler";
import type { Request, Response } from "express";

export const usersController = asyncHandler(
	async (_: Request, res: Response) => {
		// TODO: Implementar listagem real de usuários do banco de dados
		res.status(200).json({
			message: "Users controller - route protected",
			users: [], // Placeholder - implementar busca real
		});
	},
);
