import { logger } from "@/lib/winston";
import type { UsersRepository } from "@/repositories/usersRepository";
import { InvalidCredentialsError } from "@/services/errors/domainErrors";
import { AuditService } from "@/services/logging/auditService";
import type { User } from "@prisma/client";
import { compare, hash } from "bcryptjs";

interface AuthenticateRequest {
	email: string;
	password: string;
	ip?: string;
}

interface AuthenticateResponse {
	user: User;
}

export class AuthenticateService {
	constructor(private userRepository: UsersRepository) {}

	async execute({
		email,
		password,
		ip = "127.0.0.1",
	}: AuthenticateRequest): Promise<AuthenticateResponse> {
		logger.info("Starting user authentication", { email });

		const user = await this.userRepository.findByEmail(email);

		if (!user) {
			logger.warn("Authentication failed: user not found", { email });
			throw new InvalidCredentialsError();
		}

		const doesPasswordMatch = await compare(password, user.password_hash);

		if (!doesPasswordMatch) {
			logger.warn("Authentication failed: invalid password", { email });
			throw new InvalidCredentialsError();
		}

		logger.info("User authenticated successfully", { userId: user.id, email });

		AuditService.userLogin(user.id, user.email, ip);

		return {
			user,
		};
	}
}
