import { env } from "@/env/index";
import { asyncHandler } from "@/middlewares/errorHandler";
import { makeAuthenticateService } from "@/services/factories/makeAuthenticateService";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const authenticateController = asyncHandler(
	async (req: Request, res: Response) => {
		const { email, password } = req.body;

		const authenticateService = makeAuthenticateService();

		const { user } = await authenticateService.execute({
			email,
			password,
			ip: req.ip || "127.0.0.1",
		});

		const { JWT_SECRET } = env;

		const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
			expiresIn: "1h",
		});

		return res.status(200).json({
			message: "User authenticated successfully",
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	},
);
