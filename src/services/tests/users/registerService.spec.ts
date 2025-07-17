import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAlreadyExistsError } from "@/services/errors/domainErrors";
import { InMemoryUsersRepository } from "@/repositories/in-memory/inMemoryUsersRepository";
import { RegisterService } from "@/services/users/registerService";
import { createUser, createRegisterRequest } from "../utils";
import { compare } from "bcryptjs";
import type { IEmailQueueService } from "@/services/interfaces";

const mockEmailQueueService: IEmailQueueService = {
	execute: vi.fn().mockResolvedValue({ jobId: "job-123", success: true }),
	sendWelcomeEmail: vi.fn(),
	sendOrderConfirmation: vi.fn(),
	sendPasswordReset: vi.fn(),
	sendAdminNotification: vi.fn(),
	scheduleEmail: vi.fn(),
	getQueueStats: vi.fn(),
	getPendingJobs: vi.fn(),
	getFailedJobs: vi.fn()
};

let usersRepository: InMemoryUsersRepository;
let sut: RegisterService;

describe("RegisterService", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new RegisterService(usersRepository, mockEmailQueueService);
		vi.clearAllMocks();
	});

	describe("Happy Path", () => {
		it("should register user with user role when valid data is provided", async () => {
			const registerRequest = createRegisterRequest({
				name: "John Doe",
				email: "johndoe@example.com",
				password: "123456",
				role: "user"
			});

			const result = await sut.execute(registerRequest);

			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("johndoe@example.com");
			expect(result.user.role).toBe("user");
		});

		it("should register user with admin role when valid data is provided", async () => {
			const registerRequest = createRegisterRequest({
				name: "Admin User",
				email: "admin@example.com",
				password: "admin123",
				role: "admin"
			});

			const result = await sut.execute(registerRequest);

			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("admin@example.com");
			expect(result.user.role).toBe("admin");
		});

		it("should hash password when registering user", async () => {
			const registerRequest = createRegisterRequest({
				password: "plainTextPassword"
			});

			const result = await sut.execute(registerRequest);

			expect(result.user.password_hash).not.toBe("plainTextPassword");
			
			const isValidPassword = await compare("plainTextPassword", result.user.password_hash);
			expect(isValidPassword).toBe(true);
		});

		it("should send welcome email when user is registered", async () => {
			const registerRequest = createRegisterRequest({
				name: "John Doe",
				email: "johndoe@example.com",
				password: "123456",
				role: "user"
			});

			const result = await sut.execute(registerRequest);

			expect(mockEmailQueueService.execute).toHaveBeenCalledWith({
				to: "johndoe@example.com",
				template: "welcome",
				data: {
					name: "John Doe",
					userId: result.user.id
				},
				priority: 1,
				delay: 0
			});
		});

		it("should not fail registration if email sending fails", async () => {
			vi.mocked(mockEmailQueueService.execute).mockRejectedValueOnce(new Error("Email service unavailable"));

			const registerRequest = createRegisterRequest({
				name: "John Doe",
				email: "johndoe@example.com",
				password: "123456",
				role: "user"
			});

			const result = await sut.execute(registerRequest);

			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("johndoe@example.com");
		});
	});

	describe("Error Cases", () => {
		it("should throw UserAlreadyExistsError when user with same email already exists", async () => {
			const existingUser = await createUser({
				email: "existing@example.com"
			});
			await usersRepository.create(existingUser);

			const registerRequest = createRegisterRequest({
				email: "existing@example.com"
			});

			await expect(sut.execute(registerRequest)).rejects.toThrow(UserAlreadyExistsError);
		});
	});
});
