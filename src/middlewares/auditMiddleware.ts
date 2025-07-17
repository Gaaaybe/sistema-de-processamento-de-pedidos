import { auditLogger } from "@/lib/winston";
import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

interface AuditableRequest extends Request {
	startTime?: number;
	user?: {
		id: string;
		email: string;
		role: Role;
	};
}

export function auditMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const auditableReq = req as AuditableRequest;
	auditableReq.startTime = Date.now();

	const originalSend = res.send;
	res.send = function (data: any) {
		const responseTime = Date.now() - (auditableReq.startTime || 0);

		auditLogger.log("HTTP_REQUEST", {
			method: req.method,
			url: req.originalUrl,
			statusCode: res.statusCode,
			responseTime,
			ip: req.ip,
			userAgent: req.get("User-Agent"),
			userId: auditableReq.user?.id,
			userEmail: auditableReq.user?.email,
			userRole: auditableReq.user?.role,
			requestBody: shouldLogBody(auditableReq) ? req.body : undefined,
			queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
		});

		return originalSend.call(this, data);
	};

	next();
}

function shouldLogBody(req: AuditableRequest): boolean {
	const sensitiveRoutes = ["/users/authenticate", "/users"];
	const skipMethods = ["GET", "HEAD", "OPTIONS"];

	return (
		!sensitiveRoutes.includes(req.path) &&
		!skipMethods.includes(req.method) &&
		req.body &&
		Object.keys(req.body).length > 0
	);
}

export function smartAuditMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const skipRoutes = ["/health", "/metrics", "/favicon.ico", "/api-docs"];

	if (skipRoutes.some((route) => req.path.startsWith(route))) {
		return next();
	}

	const auditMethods = ["POST", "PUT", "DELETE", "PATCH"];

	const sensitiveRoutes = ["/admin", "/users/export", "/orders/report"];

	const shouldAudit =
		auditMethods.includes(req.method) ||
		sensitiveRoutes.some((route) => req.path.startsWith(route));

	if (shouldAudit) {
		return auditMiddleware(req, res, next);
	}

	next();
}
