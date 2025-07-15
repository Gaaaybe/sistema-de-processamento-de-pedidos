import type { Order } from "@prisma/client";

export interface EmitOrderServiceRequest {
	userId: string;
	title: string;
	description?: string;
	imageBuffer: Buffer;
}

export interface EmitOrderServiceResponse {
	order: Order;
}

export interface IEmitOrderService {
	execute(request: EmitOrderServiceRequest): Promise<EmitOrderServiceResponse>;
}
