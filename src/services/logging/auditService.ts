import { auditLogger } from "@/lib/winston";

export interface AuditEvent {
	action: string;
	resource: string;
	resourceId?: string;
	userId?: string;
	userEmail?: string;
	details?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export const AuditService = {
	log(event: AuditEvent) {
		auditLogger.log("DOMAIN_EVENT", {
			...event,
			environment: process.env.NODE_ENV,
		});
	},

	userCreated(userId: string, userEmail: string, createdBy?: string) {
		AuditService.log({
			action: "USER_CREATED",
			resource: "user",
			resourceId: userId,
			userId: createdBy,
			details: { userEmail },
		});
	},

	userLogin(userId: string, userEmail: string, ip: string) {
		AuditService.log({
			action: "USER_LOGIN",
			resource: "auth",
			userId,
			details: { userEmail, ip },
		});
	},

	orderCreated(orderId: string, userId: string, orderDetails: Record<string, unknown>) {
		AuditService.log({
			action: "ORDER_CREATED",
			resource: "order",
			resourceId: orderId,
			userId,
			details: orderDetails,
		});
	},

	orderStatusChanged(
		orderId: string,
		oldStatus: string,
		newStatus: string,
		userId: string,
	) {
		AuditService.log({
			action: "ORDER_STATUS_CHANGED",
			resource: "order",
			resourceId: orderId,
			userId,
			details: { oldStatus, newStatus },
		});
	},

	dataExported(resource: string, userId: string, filters: Record<string, unknown>) {
		AuditService.log({
			action: "DATA_EXPORTED",
			resource,
			userId,
			details: { filters },
		});
	},

	imageUploaded(publicId: string, userId: string, details: {
		folder: string;
		url: string;
		size: number;
		format: string;
	}) {
		AuditService.log({
			action: "IMAGE_UPLOADED",
			resource: "image",
			resourceId: publicId,
			userId,
			details,
		});
	},

	imageDeleted(publicId: string, userId?: string) {
		AuditService.log({
			action: "IMAGE_DELETED",
			resource: "image",
			resourceId: publicId,
			userId,
		});
	},

	uploadError(userId: string, error: string) {
		AuditService.log({
			action: "UPLOAD_ERROR",
			resource: "image",
			userId,
			details: { error },
		});
	},

	securityEvent(action: string, userId?: string, details?: Record<string, unknown>) {
		AuditService.log({
			action,
			resource: "security",
			userId,
			details,
		});
	},
};
