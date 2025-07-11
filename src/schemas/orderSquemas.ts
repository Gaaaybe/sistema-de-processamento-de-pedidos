import { z } from "zod";

export const emitOrderRequestSchema = z
	.object({
		title: z
			.string()
			.min(1, "Título é obrigatório")
			.max(100, "Título deve ter no máximo 100 caracteres"),
		description: z
			.string()
			.max(1000, "Descrição deve ter no máximo 1000 caracteres")
			.optional(),
		imageUrl: z.string().url("URL da imagem inválida").optional(), // Será preenchida pelo middleware
		imagePublicId: z.string().optional(), // Para controle do Cloudinary
	})
	.strict();

export const emitOrderResponseSchema = z.object({
	message: z.string(),
	order: z.object({
		id: z.string(),
		title: z.string(),
		description: z.string(),
		imageUrl: z.string(),
		status: z.enum(["pending", "processing", "approved", "rejected"]),
		createdAt: z.string().datetime(),
		userId: z.string(),
	}),
});

export type EmitOrderRequest = z.infer<typeof emitOrderRequestSchema>;
export type EmitOrderResponse = z.infer<typeof emitOrderResponseSchema>;
