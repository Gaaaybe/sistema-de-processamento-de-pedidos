import { env } from "@/env/index";
import { UnauthorizedError } from "@/services/errors/domainErrors";
import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const validateJWT = (requiredRole?: Role) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			return next(new UnauthorizedError("Token not provided"));
		}

		try {
			const { JWT_SECRET } = env;
			const decoded = jwt.verify(token, JWT_SECRET) as {
				role: Role;
				sub: string;
			};

			req.user = { id: decoded.sub, role: decoded.role };

			if (requiredRole && decoded.role !== requiredRole) {
				return next(new UnauthorizedError("Access Denied"));
			}

			next();
		} catch (error) {
			next(error);
		}
	};
};
