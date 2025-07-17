import { logger } from "@/lib/winston";
import { UserAlreadyExistsError } from "@/services/errors/domainErrors";
import { AuditService } from "@/services/logging/auditService";
import type { 
	IRegisterService, 
	RegisterServiceRequest, 
	RegisterServiceResponse,
	IEmailQueueService
} from "@/services/interfaces";
import { hash } from "bcryptjs";
import type { UsersRepository } from "@/repositories/usersRepository";

export class RegisterService implements IRegisterService {
	constructor(
		private usersRepository: UsersRepository,
		private emailQueueService: IEmailQueueService
	) {}

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

		try {
			await this.emailQueueService.execute({
				to: user.email,
				template: "welcome",
				data: {
					name: user.name,
					userId: user.id
				},
				priority: 1,
				delay: 0
			});
			logger.info("Welcome email queued successfully", { userId: user.id, email });
		} catch (error) {
			logger.error("Failed to queue welcome email", { 
				userId: user.id, 
				email, 
				error: error instanceof Error ? error.message : 'Unknown error' 
			});
		}

		return {
			user,
		};
	}
}
