import type { Order } from "@prisma/client";

export interface GetAllOrdersServiceResponse {
    orders: Order[];
}

export interface IGetAllOrdersService {
    execute(): Promise<GetAllOrdersServiceResponse>;
}