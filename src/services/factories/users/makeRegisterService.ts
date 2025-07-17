import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { RegisterService } from "@/services/users/registerService";
import { makeEmailQueueService } from "@/services/factories/shared/makeEmailQueueService";
import type { IRegisterService } from "@/services/interfaces";

export function makeRegisterService(): IRegisterService {
	const usersRepository = new PrismaUsersRepository();
	const emailQueueService = makeEmailQueueService();
	const registerService = new RegisterService(usersRepository, emailQueueService);
	return registerService;
}
