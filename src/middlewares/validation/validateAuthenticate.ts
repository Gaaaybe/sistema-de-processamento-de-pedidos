import { authenticateRequestSchema } from "@/schemas/userSchemas";
import type { NextFunction, Request, Response } from "express";

export const validateAuthenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = authenticateRequestSchema.safeParse(req.body);
	if (!result.success) {
		// Passa o erro ZodError para o middleware global
		return next(result.error);
	}
	next();
};
