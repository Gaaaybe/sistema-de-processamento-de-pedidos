import { beforeEach, describe, expect, it } from "vitest";
import { InvalidCredentialsError } from "@/services/errors/domainErrors";
import { InMemoryUsersRepository } from "@/repositories/in-memory/inMemoryUsersRepository";
import { AuthenticateService } from "@/services/users/authenticateService";
import { createUser, createAuthRequest } from "../utils";

let usersRepository: InMemoryUsersRepository;
let sut: AuthenticateService;

describe("AuthenticateService", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		sut = new AuthenticateService(usersRepository);

		// Arrange: Create test user
		const testUser = await createUser({
			name: "John Doe",
			email: "johndoe@example.com"
		});
		await usersRepository.create(testUser);
	});

	describe("Happy Path", () => {
		it("should authenticate user when credentials are valid", async () => {
			// Arrange
			const authRequest = createAuthRequest({
				email: "johndoe@example.com",
				password: "123456"
			});

			// Act
			const result = await sut.execute(authRequest);

			// Assert
			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("johndoe@example.com");
		});

		it("should authenticate user with IP address when provided", async () => {
			// Arrange
			const authRequest = createAuthRequest({
				email: "johndoe@example.com",
				password: "123456",
				ip: "192.168.1.1"
			});

			// Act
			const result = await sut.execute(authRequest);

			// Assert
			expect(result).toBeDefined();
			expect(result.user).toHaveProperty("id");
			expect(result.user.email).toBe("johndoe@example.com");
		});
	});

	describe("Error Cases", () => {
		it("should throw InvalidCredentialsError when user does not exist", async () => {
			// Arrange
			const authRequest = createAuthRequest({
				email: "nonexistent@example.com",
				password: "123456"
			});

			// Act & Assert
			await expect(sut.execute(authRequest)).rejects.toThrow(InvalidCredentialsError);
		});

		it("should throw InvalidCredentialsError when password is incorrect", async () => {
			// Arrange
			const authRequest = createAuthRequest({
				email: "johndoe@example.com",
				password: "wrongpassword"
			});

			// Act & Assert
			await expect(sut.execute(authRequest)).rejects.toThrow(InvalidCredentialsError);
		});
	});
});
