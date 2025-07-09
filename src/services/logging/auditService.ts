import { auditLogger } from '@/lib/winston';

export interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  details?: any;
  metadata?: any;
}

export class AuditService {
  static log(event: AuditEvent) {
    auditLogger.log('DOMAIN_EVENT', {
      ...event,
      environment: process.env.NODE_ENV
    });
  }

  static userCreated(userId: string, userEmail: string, createdBy?: string) {
    this.log({
      action: 'USER_CREATED',
      resource: 'user',
      resourceId: userId,
      userId: createdBy,
      details: { userEmail }
    });
  }

  static userLogin(userId: string, userEmail: string, ip: string) {
    this.log({
      action: 'USER_LOGIN',
      resource: 'auth',
      userId,
      details: { userEmail, ip }
    });
  }

  static orderCreated(orderId: string, userId: string, orderDetails: any) {
    this.log({
      action: 'ORDER_CREATED',
      resource: 'order',
      resourceId: orderId,
      userId,
      details: orderDetails
    });
  }

  static orderStatusChanged(orderId: string, oldStatus: string, newStatus: string, userId: string) {
    this.log({
      action: 'ORDER_STATUS_CHANGED',
      resource: 'order',
      resourceId: orderId,
      userId,
      details: { oldStatus, newStatus }
    });
  }

  static dataExported(resource: string, userId: string, filters: any) {
    this.log({
      action: 'DATA_EXPORTED',
      resource,
      userId,
      details: { filters }
    });
  }
}