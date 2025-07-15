import { beforeEach, describe, expect, it } from "vitest";
import { UserAlreadyExistsError } from "@/services/errors/domainErrors";
import { InMemoryUsersRepository } from "@/repositories/in-memory/inMemoryUsersRepository";
import { RegisterService } from "@/services/users/registerService";
import { createUser, createRegisterRequest } from "../utils";
import { compare } from "bcryptjs";

let usersRepository: InMemoryUsersRepository;
let sut: RegisterService;

describe("RegisterService", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new RegisterService(usersRepository);
	});

	describe("Happy Path", () => {
		it("should register user with user role when valid data is provided", async () => {
			// Arrange
			const registerRequest = createRegisterRequest({
				name: "John Doe",
				email: "johndoe@example.com",
				password: "123456",
				role: "user"
			});

			// Act
			const result = await sut.execute(registerRequest);

			// Assert
			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("johndoe@example.com");
			expect(result.user.role).toBe("user");
		});

		it("should register user with admin role when valid data is provided", async () => {
			// Arrange
			const registerRequest = createRegisterRequest({
				name: "Admin User",
				email: "admin@example.com",
				password: "admin123",
				role: "admin"
			});

			// Act
			const result = await sut.execute(registerRequest);

			// Assert
			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("admin@example.com");
			expect(result.user.role).toBe("admin");
		});

		it("should hash password when registering user", async () => {
			// Arrange
			const registerRequest = createRegisterRequest({
				password: "plainTextPassword"
			});

			// Act
			const result = await sut.execute(registerRequest);

			// Assert
			expect(result.user.password_hash).not.toBe("plainTextPassword");
			
			// Verify password is correctly hashed
			const isValidPassword = await compare("plainTextPassword", result.user.password_hash);
			expect(isValidPassword).toBe(true);
		});
	});

	describe("Error Cases", () => {
		it("should throw UserAlreadyExistsError when user with same email already exists", async () => {
			// Arrange
			const existingUser = await createUser({
				email: "existing@example.com"
			});
			await usersRepository.create(existingUser);

			const registerRequest = createRegisterRequest({
				email: "existing@example.com"
			});

			// Act & Assert
			await expect(sut.execute(registerRequest)).rejects.toThrow(UserAlreadyExistsError);
		});
	});
});
