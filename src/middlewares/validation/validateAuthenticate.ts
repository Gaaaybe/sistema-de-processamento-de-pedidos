import { authenticateRequestSchema } from "@/schemas/userSchemas";
import type { NextFunction, Request, Response } from "express";

export const validateAuthenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const result = authenticateRequestSchema.safeParse(req.body);
	if (!result.success) {
		return next(result.error);
	}
	next();
};
