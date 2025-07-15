import type { User } from "@prisma/client";

export interface AuthenticateServiceRequest {
	email: string;
	password: string;
	ip?: string;
}

export interface AuthenticateServiceResponse {
	user: User;
}

export interface IAuthenticateService {
	execute(request: AuthenticateServiceRequest): Promise<AuthenticateServiceResponse>;
}
