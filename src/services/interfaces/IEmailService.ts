export interface SendEmailRequest {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export interface SendEmailResponse {
  messageId: string;
  success: boolean;
}

export interface QueueEmailRequest {
  to: string;
  template: string;
  data: Record<string, unknown>;
  priority?: number;
  delay?: number;
}

export interface QueueEmailResponse {
  jobId: string;
  success: boolean;
}

export interface IEmailService {
  execute(request: SendEmailRequest): Promise<SendEmailResponse>;
}

export interface IEmailQueueService {
  execute(request: QueueEmailRequest): Promise<QueueEmailResponse>;
  
  sendWelcomeEmail(to: string, userData: { name: string; userId: string }): Promise<QueueEmailResponse>;
  sendOrderConfirmation(to: string, orderData: { orderId: string; title: string; description: string; status: string; userId: string }): Promise<QueueEmailResponse>;
  sendPasswordReset(to: string, resetData: { name: string; resetLink: string; userId: string }): Promise<QueueEmailResponse>;
  sendAdminNotification(to: string, adminData: { subject: string; event: string; details: Record<string, unknown>; timestamp: string }): Promise<QueueEmailResponse>;
  scheduleEmail(to: string, template: string, data: Record<string, unknown>, delayInMs: number): Promise<QueueEmailResponse>;
  
  getQueueStats(): Promise<{ waiting: number; active: number; completed: number; failed: number; }>;
  getPendingJobs(): Promise<Array<{ id: string | undefined; data: Record<string, unknown>; opts: Record<string, unknown>; }>>;
  getFailedJobs(): Promise<Array<{ id: string | undefined; data: Record<string, unknown>; failedReason: string; processedOn: number | undefined; }>>;
}
