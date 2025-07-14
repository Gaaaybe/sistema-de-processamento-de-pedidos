import app from "@/app";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

async function cleanDatabase() {
  try {
    await prisma.$executeRaw`DELETE FROM "orders"`;
    await prisma.$executeRaw`DELETE FROM "users"`;
    await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "orders_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "users_id_seq" RESTART WITH 1`;
  } catch (error) {
    console.error("Erro na limpeza do banco:", error);
  }
}

describe("Register User E2E", () => {
	beforeEach(async () => {
		await cleanDatabase();
	});

	afterEach(async () => {
		await cleanDatabase();
	});

	describe("Casos de sucesso", () => {
		it("deve registrar um novo usuário admin", async () => {
			const response = await request(app).post("/users").send({
				name: "Gabriel Admin",
				email: "gabriel.admin@email.com",
				password: "senha123aA",
				role: "admin",
			});

			expect(response.status).toBe(201);
			expect(response.body.message).toBe("User registered successfully");

			// Verificar se foi salvo no banco
			const user = await prisma.user.findUnique({
				where: { email: "gabriel.admin@email.com" }
			});
			expect(user).toBeTruthy();
			expect(user?.name).toBe("Gabriel Admin");
			expect(user?.role).toBe("admin");
		});

		it("deve registrar um novo usuário user", async () => {
			const response = await request(app).post("/users").send({
				name: "João User",
				email: "joao.user@email.com",
				password: "minhaSenh@123",
				role: "user",
			});

			expect(response.status).toBe(201);
			expect(response.body.message).toBe("User registered successfully");

			// Verificar se foi salvo no banco
			const user = await prisma.user.findUnique({
				where: { email: "joao.user@email.com" }
			});
			expect(user).toBeTruthy();
			expect(user?.name).toBe("João User");
			expect(user?.role).toBe("user");
		});

		it("deve criptografar a senha corretamente", async () => {
			const password = "minhaSenha123@";
			
			const response = await request(app).post("/users").send({
				name: "Teste Hash",
				email: "teste.hash@email.com",
				password,
				role: "user",
			});

			expect(response.status).toBe(201);

			const user = await prisma.user.findUnique({
				where: { email: "teste.hash@email.com" }
			});

			expect(user).toBeTruthy();
			// Verificar se a senha foi hash-eada
			expect(user?.password_hash).not.toBe(password);
			// Verificar se o hash é válido
			const isValidHash = await bcrypt.compare(password, user?.password_hash || "");
			expect(isValidHash).toBe(true);
		});
	});

	describe("Validação de campos obrigatórios", () => {
		it("não deve registrar usuário sem nome", async () => {
			const response = await request(app).post("/users").send({
				email: "teste@email.com",
				password: "senha123aA",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "name",
						message: "Required"
					})
				])
			);
		});

		it("não deve registrar usuário sem email", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				password: "senha123aA",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "email",
						message: "Required"
					})
				])
			);
		});

		it("não deve registrar usuário sem senha", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "password",
						message: "Required"
					})
				])
			);
		});

		it("deve usar role padrão 'user' quando não especificado", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste.role@email.com",
				password: "senha123aA",
			});

			expect(response.status).toBe(201);
			expect(response.body.message).toBe("User registered successfully");

			// Verificar se o usuário foi criado com role 'user'
			const user = await prisma.user.findUnique({
				where: { email: "teste.role@email.com" }
			});
			expect(user?.role).toBe("user");
		});
	});

	describe("Validação de formato", () => {
		it("não deve registrar usuário com email inválido", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "email-invalido",
				password: "senha123aA",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "email",
						message: "Email inválido"
					})
				])
			);
		});

		it("não deve registrar usuário com nome vazio", async () => {
			const response = await request(app).post("/users").send({
				name: "",
				email: "teste@email.com",
				password: "senha123aA",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "name",
						message: "Nome é obrigatório"
					})
				])
			);
		});
	});

	describe("Validação de senha", () => {
		it("não deve registrar usuário com senha muito curta", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				password: "123",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "password",
						message: "Senha deve ter pelo menos 6 caracteres"
					})
				])
			);
		});

		it("não deve registrar usuário com senha sem letra maiúscula", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				password: "senha123a",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "password",
						message: "Deve conter ao menos uma letra maiúscula"
					})
				])
			);
		});

		it("não deve registrar usuário com senha sem letra minúscula", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				password: "SENHA123A",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "password",
						message: "Deve conter ao menos uma letra minúscula"
					})
				])
			);
		});

		it("não deve registrar usuário com senha sem número", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				password: "senhaAAaa",
				role: "user",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "password",
						message: "Deve conter ao menos um número"
					})
				])
			);
		});
	});

	describe("Validação de role", () => {
		it("não deve registrar usuário com role inválida", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				password: "senha123aA",
				role: "superuser",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "role",
						message: expect.stringContaining("Invalid enum value")
					})
				])
			);
		});
	});

	describe("Casos de duplicação", () => {
		it("não deve registrar usuário com email duplicado", async () => {
			// Primeiro usuário
			await prisma.user.create({
				data: {
					name: "Gabriel",
					email: "gabriel@email.com",
					password_hash: await bcrypt.hash("senha123aA", 10),
					role: "admin",
				},
			});

			// Tentativa de registrar com mesmo email
			const response = await request(app).post("/users").send({
				name: "Outro Gabriel",
				email: "gabriel@email.com",
				password: "outraSenha123A",
				role: "user",
			});

			expect(response.status).toBe(409);
			expect(response.body.message).toMatch(/already exists/i);
		});

		it("deve permitir usuários com nomes iguais mas emails diferentes", async () => {
			// Primeiro usuário
			await request(app).post("/users").send({
				name: "João Silva",
				email: "joao1@email.com",
				password: "senha123aA",
				role: "user",
			});

			// Segundo usuário com mesmo nome
			const response = await request(app).post("/users").send({
				name: "João Silva",
				email: "joao2@email.com",
				password: "senha123aA",
				role: "admin",
			});

			expect(response.status).toBe(201);
			expect(response.body.message).toBe("User registered successfully");
		});
	});

	describe("Casos de body malformado", () => {
		it("não deve registrar com body vazio", async () => {
			const response = await request(app).post("/users").send({});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
		});

		it("não deve registrar com campos extras (strict mode)", async () => {
			const response = await request(app).post("/users").send({
				name: "Teste",
				email: "teste@email.com",
				password: "senha123aA",
				role: "user",
				extraField: "not allowed",
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe("Validation failed");
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: "",
						message: "Unrecognized key(s) in object: 'extraField'"
					})
				])
			);
		});
	});
});
