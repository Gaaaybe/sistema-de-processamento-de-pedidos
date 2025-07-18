import { asyncHandler } from "@/middlewares";
import { makeRegisterService } from "@/services";
import type { Request, Response } from "express";

export const registerController = asyncHandler(
	async (req: Request, res: Response) => {
		const { name, email, password, role } = req.body;

		const registerService = makeRegisterService();

		await registerService.execute({
			name,
			email,
			password,
			role,
		});

		return res.status(201).json({ message: "User registered successfully" });
	},
);
