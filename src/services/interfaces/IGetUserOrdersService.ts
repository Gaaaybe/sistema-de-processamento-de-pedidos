import type { Order } from "@prisma/client";

export interface GetUserOrdersServiceRequest {
	userId: string;
}

export interface GetUserOrdersServiceResponse {
	orders: Order[];
}

export interface IGetUserOrdersService {
	execute(request: GetUserOrdersServiceRequest): Promise<GetUserOrdersServiceResponse>;
}
