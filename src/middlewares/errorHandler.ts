import { mapDomainErrorToHttp } from "@/controllers/errors/errorMapper";
import { env } from "@/env";
import { logger } from "@/lib/winston";
import { DomainError } from "@/services/errors/domainErrors";
import type { NextFunction, Request, Response } from "express";
import type multer from "multer";
import type { ZodError } from "zod";

interface ErrorResponse {
	message: string;
	errors?: Array<{
		field?: string;
		message: string;
		code?: string;
	}>;
	timestamp: string;
	path: string;
	method: string;
	statusCode: number;
	stack?: string;
}

interface ErrorHandlerResult {
	statusCode: number;
	message: string;
	errors?: Array<{ field?: string; message: string; code?: string }>;
}

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly code?: string;

	constructor(message: string, statusCode = 500, code?: string) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;

		Error.captureStackTrace(this, this.constructor);
	}
}

function createErrorResponse(
	message: string,
	statusCode: number,
	req: Request,
	errors?: Array<{ field?: string; message: string; code?: string }>,
): ErrorResponse {
	return {
		message,
		errors,
		timestamp: new Date().toISOString(),
		path: req.originalUrl,
		method: req.method,
		statusCode,
	};
}

function logError(error: Error, req: Request, statusCode: number) {
	if (env.NODE_ENV === "test" && statusCode < 500) {
		return;
	}

	const logData = {
		message: error.message,
		stack: error.stack,
		statusCode,
		method: req.method,
		url: req.originalUrl,
		userAgent: req.get("User-Agent"),
		ip: req.ip,
		...(req.user && { userId: req.user.id, userRole: req.user.role }),
	};

	if (statusCode >= 500) {
		logger.error("🚨 SERVER ERROR:", logData);
	} else if (statusCode >= 400) {
		logger.warn("⚠️  CLIENT ERROR:", logData);
	}
}

const errorHandlers = new Map<string, (error: unknown) => ErrorHandlerResult>([
	[
		"ZodError",
		(error: unknown) => {
			const zodError = error as ZodError;
			return {
				statusCode: 400,
				message: "Validation failed",
				errors: zodError.errors.map((err) => ({
					field: err.path.join("."),
					message: err.message,
					code: err.code,
				})),
			};
		},
	],

	[
		"JsonWebTokenError",
		() => ({
			statusCode: 401,
			message: "Invalid token",
		}),
	],

	[
		"TokenExpiredError",
		() => ({
			statusCode: 401,
			message: "Token expired",
		}),
	],

	[
		"CastError",
		() => ({
			statusCode: 400,
			message: "Invalid ID format",
		}),
	],

	[
		"ValidationError",
		(error: unknown) => {
			const validationError = error as DomainError;
			return {
				statusCode: 400,
				message: validationError.message,
			};
		},
	],

	[
		"MulterError",
		(error: unknown) => {
			const multerError = error as multer.MulterError;
			
			const multerErrorMessages: Record<string, string> = {
				LIMIT_FILE_SIZE: "File size too large. Maximum 5MB allowed.",
				LIMIT_UNEXPECTED_FILE: 'Use "image" as the field name for file upload.',
				LIMIT_FILE_COUNT: "Only one file is allowed.",
				LIMIT_FIELD_COUNT: "Too many fields in the form.",
				LIMIT_FIELD_KEY: "Field name too long.",
				LIMIT_FIELD_VALUE: "Field value too long.",
				LIMIT_PART_COUNT: "Too many parts in the multipart form.",
			};

			const message = multerErrorMessages[multerError.code] || `Upload error: ${multerError.message}`;

			return {
				statusCode: 400,
				message,
			};
		},
	],
]);

export function globalErrorHandler(
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	let statusCode = 500;
	let message = "Internal server error";
	let errors:
		| Array<{ field?: string; message: string; code?: string }>
		| undefined;

	if (error instanceof AppError) {
		statusCode = error.statusCode;
		message = error.message;
	} else if (error instanceof DomainError) {
		const httpError = mapDomainErrorToHttp(error);
		statusCode = httpError.statusCode;
		message = httpError.message;
	} else if (error.message.includes("CORS")) {
		statusCode = 403;
		message = "CORS policy violation";
	} else {
		const handler = errorHandlers.get(error.constructor.name);
		if (handler) {
			const result = handler(error);
			statusCode = result.statusCode;
			message = result.message;
			errors = result.errors;
		}
	}

	logError(error, req, statusCode);

	const errorResponse = createErrorResponse(message, statusCode, req, errors);

	// Remover informações sensíveis em produção
	if (env.NODE_ENV === "production") {
		if (statusCode >= 500) {
			errorResponse.message = "Internal server error";
		}
		// Nunca incluir stack trace em produção
	} else if (env.NODE_ENV === "dev" && statusCode >= 500) {
		errorResponse.stack = error.stack;
	}

	res.status(statusCode).json(errorResponse);
}

export function asyncHandler<T extends Request, U extends Response>(
	fn: (req: T, res: U, next: NextFunction) => Promise<unknown>,
) {
	return (req: T, res: U, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

export function notFoundHandler(req: Request, res: Response) {
	const errorResponse = createErrorResponse(
		`Route ${req.method} ${req.originalUrl} not found`,
		404,
		req,
	);

	logger.warn("🔍 ROUTE NOT FOUND:", {
		method: req.method,
		url: req.originalUrl,
		ip: req.ip,
		userAgent: req.get("User-Agent"),
		timestamp: new Date().toISOString(),
	});

	res.status(404).json(errorResponse);
}

export function registerErrorHandler(
	errorClass: string,
	handler: (error: unknown) => ErrorHandlerResult,
) {
	errorHandlers.set(errorClass, handler);
}

export function createDomainError(
	name: string,
	defaultStatusCode = 400,
	defaultMessage?: string,
) {
	registerErrorHandler(name, (error) => {
		const err = error as Error;
		return {
			statusCode: defaultStatusCode,
			message: defaultMessage || err.message,
		};
	});
}
