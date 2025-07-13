import app from "@/app";
import { prisma } from "@/lib/prisma";
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

	it("deve registrar um novo usuário", async () => {
		const response = await request(app).post("/users").send({
			name: "Gabriel",
			email: "gabriel@email.com",
			password: "senha123aA",
			role: "admin",
		});

		expect(response.status).toBe(201);
		expect(response.body.message).toBe("User registered successfully");
	});

	it("não deve registrar usuário duplicado", async () => {
		await prisma.user.create({
			data: {
				name: "Gabriel",
				email: "gabriel@email.com",
				password_hash: "senha123aA",
				role: "admin",
			},
		});

		const response = await request(app).post("/users").send({
			name: "Gabriel",
			email: "gabriel@email.com",
			password: "senha123aA",
			role: "admin",
		});

		console.log(response.body);
		expect(response.status).toBe(409);
		expect(response.body.message).toMatch(/already exists/i);
	});
});
