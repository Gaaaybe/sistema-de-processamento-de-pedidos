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

export class AuditService {
	static log(event: AuditEvent) {
		auditLogger.log("DOMAIN_EVENT", {
			...event,
			environment: process.env.NODE_ENV,
		});
	}

	static userCreated(userId: string, userEmail: string, createdBy?: string) {
		this.log({
			action: "USER_CREATED",
			resource: "user",
			resourceId: userId,
			userId: createdBy,
			details: { userEmail },
		});
	}

	static userLogin(userId: string, userEmail: string, ip: string) {
		this.log({
			action: "USER_LOGIN",
			resource: "auth",
			userId,
			details: { userEmail, ip },
		});
	}

	static orderCreated(orderId: string, userId: string, orderDetails: Record<string, unknown>) {
		AuditService.log({
			action: "ORDER_CREATED",
			resource: "order",
			resourceId: orderId,
			userId,
			details: orderDetails,
		});
	}

	static orderStatusChanged(
		orderId: string,
		oldStatus: string,
		newStatus: string,
		userId: string,
	) {
		this.log({
			action: "ORDER_STATUS_CHANGED",
			resource: "order",
			resourceId: orderId,
			userId,
			details: { oldStatus, newStatus },
		});
	}

	static dataExported(resource: string, userId: string, filters: Record<string, unknown>) {
		AuditService.log({
			action: "DATA_EXPORTED",
			resource,
			userId,
			details: { filters },
		});
	}

	static imageUploaded(publicId: string, userId: string, details: {
		folder: string;
		url: string;
		size: number;
		format: string;
	}) {
		this.log({
			action: "IMAGE_UPLOADED",
			resource: "image",
			resourceId: publicId,
			userId,
			details,
		});
	}

	static imageDeleted(publicId: string, userId?: string) {
		this.log({
			action: "IMAGE_DELETED",
			resource: "image",
			resourceId: publicId,
			userId,
		});
	}

	static uploadError(userId: string, error: string) {
		this.log({
			action: "UPLOAD_ERROR",
			resource: "image",
			userId,
			details: { error },
		});
	}

	static securityEvent(action: string, userId?: string, details?: Record<string, unknown>) {
		AuditService.log({
			action,
			resource: "security",
			userId,
			details,
		});
	}
}
