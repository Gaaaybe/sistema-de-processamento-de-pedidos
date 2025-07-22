import type { SendEmailRequest, QueueEmailRequest } from "@/services/interfaces";

/**
 * Utilitários para criar dados de teste dos serviços de email
 */

export function createSendEmailRequest(overrides: Partial<SendEmailRequest> = {}): SendEmailRequest {
  return {
    to: "test@example.com",
    template: "welcome",
    data: {
      name: "Test User",
      userId: "user-123"
    },
    ...overrides
  };
}

export function createQueueEmailRequest(overrides: Partial<QueueEmailRequest> = {}): QueueEmailRequest {
  return {
    to: "test@example.com",
    template: "welcome",
    data: {
      name: "Test User",
      userId: "user-123"
    },
    priority: 1,
    delay: 0,
    ...overrides
  };
}

export function createWelcomeEmailData(overrides: Record<string, unknown> = {}) {
  return {
    name: "John Doe",
    userId: "user-123",
    ...overrides
  };
}

export function createOrderConfirmationData(overrides: Record<string, unknown> = {}) {
  return {
    orderId: "order-123",
    title: "Test Order",
    description: "Test order description",
    status: "PENDING",
    userId: "user-456",
    ...overrides
  };
}

export function createPasswordResetData(overrides: Record<string, unknown> = {}) {
  return {
    name: "Jane Smith",
    resetLink: "https://example.com/reset?token=abc123",
    userId: "user-789",
    ...overrides
  };
}

export function createAdminNotificationData(overrides: Record<string, unknown> = {}) {
  return {
    subject: "System Alert",
    event: "User Registration",
    details: { userId: "new-user-123", action: "created" },
    timestamp: "2025-07-16T10:30:00Z",
    ...overrides
  };
}

export function createMockJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-123",
    data: {
      type: "welcome",
      to: "test@example.com",
      data: { name: "Test User", userId: "user-123" }
    },
    opts: {
      priority: 1,
      delay: 0
    },
    ...overrides
  };
}

export function createMockFailedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "failed-job-123",
    data: {
      type: "welcome",
      to: "test@example.com",
      data: { name: "Test User", userId: "user-123" }
    },
    failedReason: "SMTP connection failed",
    processedOn: 1642694400000,
    ...overrides
  };
}

export const mockEmailTemplates = {
  welcome: {
    subject: "Welcome Template",
    html: "<h1>Welcome!</h1>",
    text: "Welcome!"
  },
  'order-confirmation': {
    subject: "Order Confirmation",
    html: "<h1>Order Confirmed</h1>",
    text: "Order Confirmed"
  },
  'password-reset': {
    subject: "Password Reset",
    html: "<h1>Reset Password</h1>",
    text: "Reset Password"
  },
  'admin-notification': {
    subject: "Admin Notification",
    html: "<h1>Admin Alert</h1>",
    text: "Admin Alert"
  }
};

export const mockMailTransporterResult = {
  messageId: "test-message-id",
  envelope: {
    from: "system@example.com",
    to: ["test@example.com"]
  },
  accepted: ["test@example.com"],
  rejected: [],
  pending: [],
  response: "250 2.0.0 OK"
};
