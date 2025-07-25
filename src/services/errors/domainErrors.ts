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

export class AdminRegistrationNotAllowedError extends DomainError {
	readonly code = "ADMIN_REGISTRATION_NOT_ALLOWED";

	constructor(message = "Admin users cannot be created through registration") {
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

export class EmailQueueError extends DomainError {
	readonly code = "EMAIL_QUEUE_ERROR";

	constructor(message = "Email queue error") {
		super(message);
	}
}

export class EmailServiceError extends DomainError {
	readonly code = "EMAIL_SERVICE_ERROR";

	constructor(message = "Email service error") {
		super(message);
	}
}

export class EmailTemplateError extends DomainError {
	readonly code = "EMAIL_TEMPLATE_ERROR";

	constructor(message = "Email template error") {
		super(message);
	}
}

export class EmailProviderError extends DomainError {
	readonly code = "EMAIL_PROVIDER_ERROR";

	constructor(message = "Email provider error") {
		super(message);
	}
}
