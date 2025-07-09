import { z } from "zod";

export const registerRequestSchema = z
	.object({
		name: z.string().min(1, "Nome é obrigatório"),
		email: z.string().email("Email inválido"),
		password: z
			.string()
			.min(6, "Senha deve ter pelo menos 6 caracteres")
			.regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
			.regex(/[a-z]/, "Deve conter ao menos uma letra minúscula")
			.regex(/[0-9]/, "Deve conter ao menos um número"),
		role: z.enum(["admin", "user"]).default("user"),
	})
	.strict();

export const registerResponseSchema = z.object({
	message: z.string()
});

export const authenticateRequestSchema = z
	.object({
		email: z.string().email("Email inválido"),
		password: z.string().min(1, "Senha é obrigatória"),
	})
	.strict();

export const authenticateResponseSchema = z.object({
	token: z.string(),
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string().email(),
		role: z.enum(["admin", "user"])
	})
});

export const errorResponseSchema = z.object({
	message: z.string(),
	errors: z.array(z.object({
		code: z.string().optional(),
		message: z.string(),
		path: z.array(z.union([z.string(), z.number()])).optional()
	})).optional()
});

export const usersListResponseSchema = z.array(
	z.object({
		id: z.string(),
		name: z.string(),
		email: z.string().email(),
		role: z.enum(["admin", "user"]),
		createdAt: z.string().datetime()
	})
);

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type AuthenticateRequest = z.infer<typeof authenticateRequestSchema>;
export type AuthenticateResponse = z.infer<typeof authenticateResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
