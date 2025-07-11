import { logger } from "@/lib/winston";
import { UserAlreadyExistsError } from "@/services/errors/domainErrors";
import { AuditService } from "@/services/logging/auditService";
import type { Role, User } from "@prisma/client";
import { hash } from "bcryptjs";
import type { UsersRepository } from "../repositories/usersRepository";

interface RegisterServiceRequest {
	name: string;
	email: string;
	password: string;
	role: Role;
}

interface RegisterServiceResponse {
	user: User;
}

export class RegisterService {
	constructor(private usersRepository: UsersRepository) {}

	async execute({
		name,
		email,
		password,
		role,
	}: RegisterServiceRequest): Promise<RegisterServiceResponse> {
		logger.info("Starting user registration", { email, role });

		const passwordHash = await hash(password, 6);
		const userWithSameEmail = await this.usersRepository.findByEmail(email);

		if (userWithSameEmail) {
			logger.warn("Registration failed: user already exists", { email });
			throw new UserAlreadyExistsError();
		}

		const user = await this.usersRepository.create({
			name,
			email,
			password_hash: passwordHash,
			role,
		});

		logger.info("User registered successfully", { userId: user.id, email });

		AuditService.userCreated(user.id, user.email);

		return {
			user,
		};
	}
}
