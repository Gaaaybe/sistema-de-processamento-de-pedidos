import type { Order } from "@prisma/client";

export interface UpdateOrderStatusServiceResponse {
    success: boolean;
    message: string;
}
export interface UpdateOrderStatusServiceRequest {
    orderId: string;
    status: Order["status"];
    adminName?: string;
    reason?: string;
}

export interface IUpdateOrderStatusService {
    execute(request: UpdateOrderStatusServiceRequest): Promise<UpdateOrderStatusServiceResponse>;
}