
import type { DomainError } from "@/services/errors/domainErrors";

interface HttpErrorMapping {
  status: number;
  message: string;
}

const DOMAIN_TO_HTTP_MAP = new Map<string, HttpErrorMapping>([
  ['UserAlreadyExistsError', { 
    status: 409, 
    message: 'User already exists' 
  }],
  ['InvalidCredentialsError', { 
    status: 401, 
    message: 'Invalid credentials' 
  }],
  ['UserNotFoundError', { 
    status: 404, 
    message: 'User not found' 
  }],
  ['UnauthorizedError', { 
    status: 403, 
    message: 'Access denied' 
  }],
  ['ValidationError', { 
    status: 400, 
    message: 'Validation failed' 
  }],
  ['OrderNotFoundError', { 
    status: 404, 
    message: 'Order not found' 
  }],
  ['InsufficientBalanceError', { 
    status: 400, 
    message: 'Insufficient balance' 
  }]
]);

export interface HttpError {
  statusCode: number;
  message: string;
  code?: string;
}

/**
 * Mapeia um erro de domínio para uma resposta HTTP apropriada
 * @param error - Erro de domínio a ser mapeado
 * @returns Objeto com statusCode e message para resposta HTTP
 */
export function mapDomainErrorToHttp(error: Error): HttpError {

  const mapping = DOMAIN_TO_HTTP_MAP.get(error.constructor.name);
  
  if (mapping) {
    return {
      statusCode: mapping.status,
      message: error.message || mapping.message,
      code: (error as DomainError).code
    };
  }
  
  console.warn(`🔍 Unmapped domain error: ${error.constructor.name}`, error.message);
  
  return {
    statusCode: 500,
    message: 'Internal server error'
  };
}

export function registerDomainErrorMapping(
  errorName: string, 
  mapping: HttpErrorMapping
): void {
  DOMAIN_TO_HTTP_MAP.set(errorName, mapping);
  console.log(`📝 Domain error mapping registered: ${errorName} → ${mapping.status}`);
}

export function getRegisteredMappings(): Map<string, HttpErrorMapping> {
  return new Map(DOMAIN_TO_HTTP_MAP);
}
