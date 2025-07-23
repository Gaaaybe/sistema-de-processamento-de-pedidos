import { z } from "zod";

export const emitOrderRequestSchema = z
	.object({
		title: z
			.string({ required_error: "Título é obrigatório" })
			.min(1, "Título é obrigatório")
			.max(100, "Título deve ter no máximo 100 caracteres"),
		description: z
			.string({ required_error: "Descrição é obrigatória" })
			.min(1, "Descrição é obrigatória")
			.max(1000, "Descrição deve ter no máximo 1000 caracteres"),
	})
	.strict();

export const emitOrderResponseSchema = z.object({
	message: z.string(),
	order: z.object({
		id: z.string(),
		title: z.string(),
		userId: z.string(),
	}),
});

export const getUserOrdersRequestSchema = z.object({
    userId: z.string().uuid("ID de usuário inválido"),
});

export const getUserOrdersResponseSchema = z.object({
    orders: z.array(
        z.object({
            id: z.string().uuid("ID de usuário inválido"),
            title: z.string(),
            description: z.string().optional(),
            imageUrl: z.string().optional(),
            status: z.enum(["pending", "processing", "completed", "cancelled"]),
            createdAt: z.string(), // ISO date string
            processedAt: z.string().nullable(), // ISO date string or null
            userId: z.string(),
        }),
    ),
});

export const updateOrderStatusRequestSchema = z.object({
    status: z.enum(["approved", "rejected", "processing"], {
        errorMap: () => ({ message: "Status must be 'approved', 'rejected', or 'processing'" })
    }),
    adminName: z.string().optional(),
    reason: z.string().optional(),
}).strict();

export const updateOrderStatusResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
        orderId: z.string(),
        status: z.string(),
        updatedAt: z.string(),
        processedBy: z.string(),
    }),
});

export type EmitOrderRequest = z.infer<typeof emitOrderRequestSchema>;
export type EmitOrderResponse = z.infer<typeof emitOrderResponseSchema>;
export type UpdateOrderStatusRequest = z.infer<typeof updateOrderStatusRequestSchema>;
export type UpdateOrderStatusResponse = z.infer<typeof updateOrderStatusResponseSchema>;
