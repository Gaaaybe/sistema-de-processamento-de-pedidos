import { makeAuthenticateService } from "@/services/factories/makeAuthenticateService";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/errorHandler";
import { env } from "@/env/index";

export const authenticateController = asyncHandler(async (req: Request, res: Response) => {
	const { email, password } = req.body;

	const authenticateService = makeAuthenticateService();

	const { user } = await authenticateService.execute({
		email,
		password,
	});

	const { JWT_SECRET } = env;

	const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
	
	return res.status(200).json({ 
		message: "User authenticated successfully", 
		token,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role
		}
	});
});
