import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "@/env";
import { mapDomainErrorToHttp } from "@/controllers/errors/errorMapper";
import { DomainError } from "@/services/errors/domainErrors";

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
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
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
  errors?: Array<{ field?: string; message: string; code?: string }>
): ErrorResponse {
  return {
    message,
    errors,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    statusCode
  };
}

function logError(error: Error, req: Request, statusCode: number) {
  const logData = {
    message: error.message,
    stack: error.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
    ...(req.user && { userId: req.user.id, userRole: req.user.role })
  };

  if (statusCode >= 500) {
    console.error('🚨 SERVER ERROR:', logData);
  } else if (statusCode >= 400) {
    console.warn('⚠️  CLIENT ERROR:', logData);
  }
}

const errorHandlers = new Map<string, (error: any) => { statusCode: number; message: string; errors?: any[] }>([
  ['ZodError', (error: ZodError) => ({
    statusCode: 400,
    message: "Validation failed",
    errors: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
  })],
  
  ['JsonWebTokenError', () => ({
    statusCode: 401,
    message: "Invalid token"
  })],
  
  ['TokenExpiredError', () => ({
    statusCode: 401,
    message: "Token expired"
  })],
  
  ['CastError', () => ({
    statusCode: 400,
    message: "Invalid ID format"
  })],
  
  ['ValidationError', () => ({
    statusCode: 400,
    message: "Validation error"
  })]
]);

export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: Array<{ field?: string; message: string; code?: string }> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } 

  else if (error instanceof DomainError) {
    const httpError = mapDomainErrorToHttp(error);
    statusCode = httpError.statusCode;
    message = httpError.message;
  }

  else if (error.message.includes('CORS')) {
    statusCode = 403;
    message = "CORS policy violation";
  } 

  else {
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
  
  if (env.NODE_ENV === 'dev' && statusCode >= 500) {
    (errorResponse as any).stack = error.stack;
  }

  if (env.NODE_ENV === 'production' && statusCode >= 500) {
    errorResponse.message = "Internal server error";
  }

  res.status(statusCode).json(errorResponse);
}

export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, res: Response) {
  const errorResponse = createErrorResponse(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    req
  );
  
  console.warn('🔍 ROUTE NOT FOUND:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json(errorResponse);
}

export function registerErrorHandler(
  errorClass: string, 
  handler: (error: any) => { statusCode: number; message: string; errors?: any[] }
) {
  errorHandlers.set(errorClass, handler);
}

export function createDomainError(
  name: string,
  defaultStatusCode: number = 400,
  defaultMessage?: string
) {
  registerErrorHandler(name, (error) => ({
    statusCode: defaultStatusCode,
    message: defaultMessage || error.message
  }));
}