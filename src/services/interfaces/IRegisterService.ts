import type { Role, User } from "@prisma/client";

export interface RegisterServiceRequest {
	name: string;
	email: string;
	password: string;
	role: Role;
}

export interface RegisterServiceResponse {
	user: User;
}

export interface IRegisterService {
	execute(request: RegisterServiceRequest): Promise<RegisterServiceResponse>;
}
