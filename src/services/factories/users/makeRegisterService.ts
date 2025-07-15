import { PrismaUsersRepository } from "@/repositories/prisma/prismaUsersRepository";
import { RegisterService } from "@/services/users/registerService";
import type { IRegisterService } from "@/services/interfaces";

export function makeRegisterService(): IRegisterService {
	const usersRepository = new PrismaUsersRepository();
	const registerService = new RegisterService(usersRepository);
	return registerService;
}
