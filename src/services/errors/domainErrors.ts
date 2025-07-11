export abstract class DomainError extends Error {
	abstract readonly code: string;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class UserAlreadyExistsError extends DomainError {
	readonly code = "USER_ALREADY_EXISTS";

	constructor(message = "User already exists") {
		super(message);
	}
}

export class InvalidCredentialsError extends DomainError {
	readonly code = "INVALID_CREDENTIALS";

	constructor(message = "Invalid credentials") {
		super(message);
	}
}

export class UserNotFoundError extends DomainError {
	readonly code = "USER_NOT_FOUND";

	constructor(message = "User not found") {
		super(message);
	}
}

export class UnauthorizedError extends DomainError {
	readonly code = "UNAUTHORIZED";

	constructor(message = "Unauthorized access") {
		super(message);
	}
}

export class ValidationError extends DomainError {
	readonly code = "VALIDATION_FAILED";

	constructor(message = "Validation failed") {
		super(message);
	}
}

export class OrderNotFoundError extends DomainError {
	readonly code = "ORDER_NOT_FOUND";

	constructor(message = "Order not found") {
		super(message);
	}
}

export class OrderAlreadyExistsError extends DomainError {
	readonly code = "ORDER_ALREADY_EXISTS";

	constructor(message = "Order already exists") {
		super(message);
	}
}
