import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { AuthenticateService } from "@/services/users/authenticateService";
import type { IAuthenticateService } from "@/services/interfaces";

export function makeAuthenticateService(): IAuthenticateService {
	const usersRepository = new PrismaUsersRepository();
	const authenticateService = new AuthenticateService(usersRepository);
	return authenticateService;
}
